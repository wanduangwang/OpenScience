// ============================================================================
// AI Chat — API Client (Mock + Real)
// ============================================================================
// During development, the mock client returns canned responses.
// When NEXT_PUBLIC_CHAT_API_URL is set, the real client connects to the backend.
// See docs/chat-api-spec.md for the full API contract.

import type {
  ChatApiClient,
  ChatMessage,
  SendRequest,
  SendResponse,
  HistoryResponse,
  ClearResponse,
  StreamMeta,
  StreamDone,
} from './types';
import { getSessionId } from './types';

// ─── Helpers ───────────────────────────────────────────────────────────────

let mockConvIdCounter = 0;
let mockMsgIdCounter = 0;

function mockConvId(): string {
  return `conv_mock_${++mockConvIdCounter}`;
}
function mockMsgId(): string {
  return `msg_mock_${++mockMsgIdCounter}`;
}

const MOCK_RESPONSES: Record<string, string> = {
  default:
    "That's a great question! Here's what I can tell you about this topic:\n\n"
    + "**Key points:**\n\n"
    + "1. **Metal-Organic Frameworks (MOFs)** are crystalline porous materials\n"
    + "2. They consist of metal ions coordinated to organic ligands\n"
    + "3. MOFs have extremely high surface areas (up to 7000 m²/g)\n\n"
    + "Would you like me to elaborate on any specific aspect?",
  hello: "Hello! I'm the OpenScience AI assistant. How can I help you today?",
  hi: "Hi there! Feel free to ask me anything about our open science resources.",
  help: "I can help you with:\n\n"
    + "- 📖 **Guide navigation** — Find the right writing template\n"
    + "- 🔬 **MOF knowledge** — Answer chemistry questions\n"
    + "- 🌍 **Language switch** — Toggle between EN and ZH\n"
    + "- 🔍 **Search** — Find content across our knowledge base",
};

function pickMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase().trim();
  if (lower === 'hello' || lower === 'hi' || lower === 'hey') return MOCK_RESPONSES.hello;
  if (lower === 'help' || lower === '?') return MOCK_RESPONSES.help;
  return MOCK_RESPONSES.default;
}

/** Simulate network delay */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Mock Client ───────────────────────────────────────────────────────────

class ChatApiClientMock implements ChatApiClient {
  async sendMessage(params: SendRequest): Promise<SendResponse | ReadableStream<Uint8Array>> {
    // Simulate 2% random error
    if (Math.random() < 0.02) {
      throw { code: 'server_error', message: 'Simulated server error for testing.' };
    }

    await delay(300 + Math.random() * 800); // 300-1100ms delay

    if (params.stream === false) {
      // Non-streaming: return full response at once
      const response: SendResponse = {
        conversationId: params.conversationId ?? mockConvId(),
        message: {
          id: mockMsgId(),
          role: 'assistant',
          content: pickMockResponse(params.message),
          timestamp: Date.now(),
          model: 'mock-gpt',
        },
      };
      return response;
    }

    // Streaming: return a ReadableStream that emits tokens one by one
    const fullText = pickMockResponse(params.message);
    const tokens = splitIntoTokens(fullText);
    const convId = params.conversationId ?? mockConvId();
    const msgId = mockMsgId();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();

        // meta event
        const meta: StreamMeta = { conversationId: convId };
        controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify(meta)}\n\n`));

        // token events
        for (const token of tokens) {
          await delay(20 + Math.random() * 40);
          controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify(token)}\n\n`));
        }

        // done event
        const donePayload: StreamDone = { id: msgId, model: 'mock-gpt', timestamp: Date.now() };
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify(donePayload)}\n\n`));

        controller.close();
      },
    });
  }

  async getHistory(): Promise<HistoryResponse> {
    return { conversations: [] };
  }

  async clearConversation(_conversationId?: string): Promise<ClearResponse> {
    console.log('[ChatAPI] Clear requested:', _conversationId ?? 'all');
    return { deleted: _conversationId ? [_conversationId] : [] };
  }
}

/** Split text into tokens (words + spaces for streaming effect) */
function splitIntoTokens(text: string): string[] {
  const tokens: string[] = [];
  let buf = '';
  for (const ch of text) {
    buf += ch;
    if (ch === ' ' || ch === '\n' || buf.length >= 8) {
      tokens.push(buf);
      buf = '';
    }
  }
  if (buf) tokens.push(buf);
  return tokens;
}

// ─── Real Client (stub) ────────────────────────────────────────────────────

class ChatApiClientReal implements ChatApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': getSessionId(),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ code: 'server_error', message: res.statusText }));
      throw err;
    }
    return res.json();
  }

  async sendMessage(params: SendRequest): Promise<SendResponse | ReadableStream<Uint8Array>> {
    if (params.stream !== false) {
      // For streaming, use fetch directly and return the body as ReadableStream
      const res = await fetch(`${this.baseUrl}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': getSessionId(),
        },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ code: 'server_error', message: res.statusText }));
        throw err;
      }
      return res.body!;
    }
    return this.request<SendResponse>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getHistory(): Promise<HistoryResponse> {
    return this.request<HistoryResponse>('/api/chat/history');
  }

  async clearConversation(conversationId?: string): Promise<ClearResponse> {
    return this.request<ClearResponse>('/api/chat/clear', {
      method: 'DELETE',
      body: JSON.stringify({ conversationId }),
    });
  }
}

// ─── Exported Singleton ────────────────────────────────────────────────────

function createClient(): ChatApiClient {
  const url =
    (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_CHAT_API_URL) ||
    undefined;
  if (url) {
    console.log('[ChatAPI] Using real backend at:', url);
    return new ChatApiClientReal(url);
  }
  console.log('[ChatAPI] Using mock client');
  return new ChatApiClientMock();
}

/** Global chat API client instance */
export const chatApi = createClient();

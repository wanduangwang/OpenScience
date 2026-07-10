// ============================================================================
// AI Chat — Type Definitions
// ============================================================================
// These types define the contract between frontend UI and backend API.
// See docs/chat-api-spec.md for full API specification.

export type MessageRole = 'user' | 'assistant' | 'system';

/** A single chat message */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;        // Markdown-rendered text
  timestamp: number;      // Unix ms
  model?: string;         // Model identifier (for assistant messages)
}

/** A conversation thread */
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/** Send a message request body */
export interface SendRequest {
  message: string;
  conversationId?: string | null;   // null = start new conversation
  model?: string;
  stream?: boolean;                  // SSE streaming, default true
}

/** Non-streaming response payload */
export interface SendResponse {
  conversationId: string;
  message: ChatMessage;
}

/** SSE: meta event payload */
export interface StreamMeta {
  conversationId: string;
}

/** SSE: done event payload */
export interface StreamDone {
  id: string;
  model?: string;
  timestamp: number;
}

/** API error payload */
export interface ApiError {
  code: 'invalid_request' | 'rate_limited' | 'server_error' | 'unauthorized';
  message: string;
  retryAfter?: number;
}

/** GET /api/chat/history response */
export interface HistoryResponse {
  conversations: Conversation[];
}

/** DELETE /api/chat/clear response */
export interface ClearResponse {
  deleted: string[];
}

/** Chat API client interface */
export interface ChatApiClient {
  sendMessage(params: SendRequest): Promise<SendResponse | ReadableStream<Uint8Array>>;
  getHistory(): Promise<HistoryResponse>;
  clearConversation(conversationId?: string): Promise<ClearResponse>;
}

// localStorage key for session ID
export const SESSION_STORAGE_KEY = 'os-chat-session';

/** Get or create a persistent session ID */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  return id;
}

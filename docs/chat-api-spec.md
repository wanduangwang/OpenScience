# AI Chat API Specification

> Version: 1.0  
> Status: Draft (frontend mock phase)  
> Last Updated: 2026-07-09  
> Target: OpenScience AI Chat feature

---

## Overview

The AI Chat feature allows users to ask questions and get AI-powered responses
directly within the OpenScience site. The chat backend is **under development**.
This document describes the API contract the frontend expects.

**Base URL**: `/api/chat`

**Content Type**: `application/json`

---

## Data Types

### Message

```typescript
interface ChatMessage {
  id: string;           // UUID, server-generated
  role: 'user' | 'assistant' | 'system';
  content: string;      // Markdown-rendered text
  timestamp: number;    // Unix ms
  model?: string;       // Model identifier (e.g. "deepseek-v3")
}
```

### Conversation

```typescript
interface Conversation {
  id: string;              // UUID
  title: string;           // Auto-generated first-message summary
  messages: ChatMessage[];
  createdAt: number;       // Unix ms
  updatedAt: number;       // Unix ms
}
```

### Send Request

```typescript
interface SendRequest {
  message: string;            // User message text
  conversationId?: string;    // Continue existing conversation, null = new
  model?: string;             // Requested model (default = "default")
  stream?: boolean;           // SSE streaming (default = true)
}
```

### Send Response (non-streaming)

```typescript
interface SendResponse {
  conversationId: string;
  message: ChatMessage;
}
```

### Error Response

```typescript
interface ApiError {
  code: string;        // e.g. "rate_limited", "invalid_request", "server_error"
  message: string;     // Human-readable description
  retryAfter?: number; // Seconds to wait before retrying (for rate_limited)
}
```

### History Response

```typescript
interface HistoryResponse {
  conversations: Conversation[];
}
```

---

## Endpoints

### 1. Send Message

Sends a user message and returns the AI response.

```
POST /api/chat/message
```

**Request Body**:

```json
{
  "message": "What is MOF in chemistry?",
  "conversationId": null,
  "model": "default",
  "stream": true
}
```

**Success Response (200, non-streaming)**:

```json
{
  "conversationId": "conv_abc123",
  "message": {
    "id": "msg_xyz789",
    "role": "assistant",
    "content": "MOF stands for **Metal-Organic Framework**...",
    "timestamp": 1779984000000,
    "model": "gpt-4"
  }
}
```

**Streaming Response (200, SSE)**:

When `stream: true`, the response uses Server-Sent Events (SSE):

```
Content-Type: text/event-stream

event: meta
data: {"conversationId":"conv_abc123"}

event: token
data: "MOF"

event: token
data: " stands for "

event: token
data: "**Metal-Organic Framework**"

event: done
data: {"id":"msg_xyz789","model":"gpt-4","timestamp":1779984000000}

event: error
data: {"code":"server_error","message":"Internal server error"}
```

**Events**:

| Event | Payload | Description |
|-------|---------|-------------|
| `meta` | `{conversationId: string}` | Sent once before first token |
| `token` | `string` | A text chunk to append to the response |
| `done` | `{id, model, timestamp}` | Signal end of stream |
| `error` | `ApiError` | An error occurred, stream terminated |

**Error Responses**:

| Code | HTTP | Description |
|------|------|-------------|
| `invalid_request` | 400 | Malformed request body |
| `rate_limited` | 429 | Too many requests; check `retryAfter` |
| `server_error` | 500 | Internal server error |

---

### 2. Get Conversation History

Retrieves all conversations for the current user session.

```
GET /api/chat/history
```

**Success Response (200)**:

```json
{
  "conversations": [
    {
      "id": "conv_abc123",
      "title": "What is MOF?",
      "messages": [
        {
          "id": "msg_001",
          "role": "user",
          "content": "What is MOF in chemistry?",
          "timestamp": 1779984000000
        },
        {
          "id": "msg_002",
          "role": "assistant",
          "content": "MOF stands for **Metal-Organic Framework**...",
          "timestamp": 1779984001000,
          "model": "gpt-4"
        }
      ],
      "createdAt": 1779984000000,
      "updatedAt": 1779984001000
    }
  ]
}
```

---

### 3. Clear Conversation

Deletes a specific conversation or all conversations.

```
DELETE /api/chat/clear
```

**Request Body**:

```json
{
  "conversationId": "conv_abc123"   // optional: omit to clear all
}
```

**Success Response (200)**:

```json
{
  "deleted": ["conv_abc123"]
}
```

---

## Frontend Mock Behavior

Until the backend is implemented, the frontend API client (`lib/chat/api.ts`)
uses mock data with the following behavior:

| Condition | Response |
|-----------|----------|
| New conversation | Creates a mock conversation with `conv_mock_xxx` ID |
| Message sent | Simulates 500-1500ms delay, returns a canned response |
| Streaming enabled | Emits tokens one by one with 30-80ms interval via `ReadableStream` |
| History | Returns an empty array |
| Clear | Logs to console, returns success |
| Network error | 2% chance of random `server_error` to test error handling |

---

## Frontend API Client Interface

The frontend provides a clean abstraction layer in `lib/chat/api.ts`:

```typescript
interface ChatApiClient {
  sendMessage(params: SendRequest): Promise<SendResponse | ReadableStream>;
  getHistory(): Promise<HistoryResponse>;
  clearConversation(conversationId?: string): Promise<{deleted: string[]}>;
}

// Two implementations:
// - ChatApiClientMock  → used during development
// - ChatApiClientReal  → used when backend is ready (reads env BASE_URL)
```

To switch from mock to real:

```typescript
// lib/chat/api.ts
export const chatApi: ChatApiClient = 
  process.env.NEXT_PUBLIC_CHAT_API_URL 
    ? new ChatApiClientReal(process.env.NEXT_PUBLIC_CHAT_API_URL)
    : new ChatApiClientMock();
```

---

## Auth & Session

- **Authentication**: TBD (the backend may use API keys, JWT, or session cookies)
- **Session identification**: The frontend passes `X-Session-Id` header (UUID stored in localStorage, key `os-chat-session`)
- Rate limiting: The backend MAY send `429` responses; the frontend will respect `retryAfter`

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-09 | v1.0 initial draft |

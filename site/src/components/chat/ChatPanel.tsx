'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from '@/lib/i18n/locale-context';
import { chatApi } from '@/lib/chat/api';
import type { ChatMessage as ChatMessageType, SendResponse, StreamMeta, StreamDone } from '@/lib/chat/types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * ChatPanel
 *
 * Floating chat overlay panel. Slides in from the bottom-right of the screen.
 * Layout: header → message list → input area.
 * Supports streaming mock responses.
 */
export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const { t } = useLocale();
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('chat.welcome'),
      timestamp: Date.now(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = useCallback(
    async (text: string) => {
      // Add user message
      const userMsg: ChatMessageType = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const result = await chatApi.sendMessage({
          message: text,
          conversationId,
          stream: true,
        });

        if (result instanceof ReadableStream) {
          // Streaming response
          const assistantId = `assistant_${Date.now()}`;
          const assistantMsg: ChatMessageType = {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            model: '',
          };
          setMessages((prev) => [...prev, assistantMsg]);

          const reader = result.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                try {
                  const parsed = JSON.parse(data);
                  if (typeof parsed === 'string') {
                    // token event
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last && last.id === assistantId) {
                        last.content += parsed;
                      }
                      return updated;
                    });
                  } else if (parsed.conversationId) {
                    // meta event
                    setConversationId(parsed.conversationId);
                  } else if (parsed.id) {
                    // done event
                    const doneData = parsed as StreamDone;
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last && last.id === assistantId) {
                        last.model = doneData.model || '';
                      }
                      return updated;
                    });
                  }
                } catch {
                  // Not JSON, skip
                }
              }
            }
          }
        } else {
          // Non-streaming response
          const response = result as SendResponse;
          if (response.conversationId) {
            setConversationId(response.conversationId);
          }
          setMessages((prev) => [...prev, response.message]);
        }
      } catch (err: any) {
        console.error('[ChatPanel] Error:', err);
        const errorMsg: ChatMessageType = {
          id: `error_${Date.now()}`,
          role: 'system',
          content: t('chat.error'),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [conversationId, t]
  );

  const handleClear = useCallback(async () => {
    if (conversationId) {
      await chatApi.clearConversation(conversationId);
    }
    setConversationId(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: t('chat.welcome'),
        timestamp: Date.now(),
      },
    ]);
  }, [conversationId, t]);

  return (
    <div
      className={`fixed bottom-20 right-4 z-[10000] flex w-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 dark:border-gray-600 dark:bg-gray-800 ${
        open
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      style={{ height: '520px', maxHeight: 'calc(100vh - 160px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5 text-blue-600"
          >
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.782a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
          </svg>
          <span className="font-semibold text-gray-800 text-sm dark:text-white">
            {t('chat.title')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 1 && (
            <button
              onClick={handleClear}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600"
              title={t('chat.clear')}
              aria-label={t('chat.clear')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600"
            aria-label={t('chat.close')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto py-3">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-start px-4 py-1.5">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5 dark:bg-gray-700">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}

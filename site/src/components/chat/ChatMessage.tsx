'use client';

import React from 'react';
import type { ChatMessage as ChatMessageType } from '@/lib/chat/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * ChatMessage
 *
 * Renders a single message bubble.
 * User messages: right-aligned blue bubble
 * Assistant messages: left-aligned gray bubble with model badge
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-gray-400 italic">{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-1.5`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md dark:bg-gray-700 dark:text-gray-100'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        {message.model && !isUser && (
          <div className="mt-1 text-[10px] opacity-50 text-right">{message.model}</div>
        )}
      </div>
    </div>
  );
}

'use client';

import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLoginButton } from '@/lib/login-button-context';
import { useAIAssistantStore } from '@/store/aiAssistantStore';
import { ChatMessageMarkdown } from './ChatMessageMarkdown';
import styles from './ChatPanel.module.css';

export function ChatPanel() {
  const messages = useAIAssistantStore((state) => state.messages);
  const suggestedQuestions = useAIAssistantStore((state) => state.suggestedQuestions);
  const sendMessage = useAIAssistantStore((state) => state.sendMessage);
  const setDemoRole = useAIAssistantStore((state) => state.setDemoRole);
  const district = useAIAssistantStore((state) => state.district);
  const isSending = useAIAssistantStore((state) => state.isSending);
  const { role } = useLoginButton();
  const [input, setInput] = useState('');
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const previousMessagesRef = useRef(messages);

  useEffect(() => {
    setDemoRole(role);
  }, [role, setDemoRole]);

  useEffect(() => {
    const element = messagesRef.current;
    if (!element) {
      previousMessagesRef.current = messages;
      return;
    }

    const previousMessages = previousMessagesRef.current;
    const resolvedMessage = messages.find((message) => {
      const previous = previousMessages.find((item) => item.id === message.id);
      return previous?.isPending && !message.isPending;
    });

    if (resolvedMessage) {
      const bubble = element.querySelector<HTMLElement>(
        `[data-message-id="${resolvedMessage.id}"]`,
      );
      if (bubble) {
        const bubbleTop = bubble.getBoundingClientRect().top;
        const messageListTop = element.getBoundingClientRect().top;
        element.scrollTop += bubbleTop - messageListTop;
      }
    } else {
      element.scrollTop = element.scrollHeight;
    }

    previousMessagesRef.current = messages;
  }, [messages]);

  const submit = (text: string) => {
    const next = text.trim();
    if (!next || isSending) return;
    void sendMessage(next);
    setInput('');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>
        Taoyuan Air AI · {role === 'government' ? '政府模式' : '民眾模式'} · {district}
      </div>

      <div className={styles.messages} ref={messagesRef}>
        {messages.length === 0 && (
          <div className={styles.suggestions} aria-label={`${district} 推薦問題`}>
            {suggestedQuestions.slice(0, 3).map((question) => (
              <button
                className={styles.suggestion}
                key={question}
                type="button"
                disabled={isSending}
                onClick={() => submit(question)}
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {messages.map((message) => (
          <div
            className={`${styles.bubble} ${
              message.role === 'user' ? styles.user : styles.assistant
            } ${message.isPending ? styles.pending : ''}`}
            data-message-id={message.id}
            key={message.id}
          >
            {message.isPending ? (
              <span className={styles.loadingText}>
                分析中
                <span className={styles.loadingDots} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            ) : message.role === 'assistant' ? (
              <ChatMessageMarkdown text={message.text} />
            ) : (
              message.text
            )}
            {message.sources && message.sources.length > 0 && (
              <div className={styles.sourceRow}>
                {message.sources.slice(0, 3).map((source) => (
                  <span className={styles.source} key={`${message.id}-${source.label}`}>
                    {source.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className={styles.disclaimer}>AI 生成回答，請以官方資料與現場狀況為準。</p>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={input}
          placeholder="詢問空氣品質、健康風險或活動建議"
          disabled={isSending}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit(input);
          }}
        />
        <button
          className={styles.send}
          type="button"
          disabled={!input.trim() || isSending}
          aria-label="送出"
          title="送出"
          onClick={() => submit(input)}
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}

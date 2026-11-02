"use client";

import { useState, useCallback, useRef } from "react";
import { fetchChatStream, type Citation } from "./api-client";

export interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  isStreaming?: boolean;
}

export function useChat(repoId: string) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [intent, setIntent] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string, questionType?: string) => {
      const userMsg: ChatMsg = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        citations: [],
      };

      const assistantMsg: ChatMsg = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        citations: [],
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetchChatStream(repoId, content, questionType);
        if (!res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        const citations: Citation[] = [];

        let isStreamingActive = true;
        while (isStreamingActive) {
          const { done, value } = await reader.read();
          if (done || controller.signal.aborted) {
            isStreamingActive = false;
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              continue;
            }
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);

                if ("token" in parsed) {
                  accumulated += parsed.token;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id ? { ...m, content: accumulated } : m
                    )
                  );
                } else if ("intent" in parsed) {
                  setIntent(parsed.intent);
                } else if ("filePath" in parsed) {
                  citations.push(parsed as Citation);
                } else if ("conversationId" in parsed) {
                  // done event
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: accumulated, citations, isStreaming: false }
                        : m
                    )
                  );
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: accumulated, citations, isStreaming: false }
              : m
          )
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: "An error occurred. Please try again.", isStreaming: false }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [repoId]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, sendMessage, isStreaming, stopStreaming, clearMessages, intent };
}


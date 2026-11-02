import { MessageRole } from "@repomentor/shared";

export interface LLMMessage {
  role: MessageRole;
  content: string;
}

export interface LLMCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  responseFormat?: "text" | "json";
}

export interface LLMStreamChunk {
  token: string;
  isComplete: boolean;
  totalTokens?: number;
}

export interface LLMProvider {
  readonly providerName: string;

  complete(prompt: string, options?: LLMCompletionOptions): Promise<string>;

  stream(
    prompt: string,
    onToken: (token: string) => void,
    options?: LLMCompletionOptions
  ): Promise<{ fullText: string; totalTokens?: number }>;
}


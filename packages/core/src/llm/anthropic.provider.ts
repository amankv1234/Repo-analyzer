import Anthropic from "@anthropic-ai/sdk";
import { LLMCompletionOptions, LLMProvider } from "./provider.interface";
import { ProviderError } from "@repomentor/shared";

export interface AnthropicProviderOptions {
  apiKey?: string;
  defaultModel?: string;
  timeoutMs?: number;
}

export class AnthropicClaudeProvider implements LLMProvider {
  public readonly providerName = "anthropic";
  private client: Anthropic;
  private defaultModel: string;

  constructor(options: AnthropicProviderOptions = {}) {
    const key = options.apiKey || process.env.ANTHROPIC_API_KEY || "";
    this.client = new Anthropic({
      apiKey: key,
      timeout: options.timeoutMs ?? 60_000,
    });
    this.defaultModel =
      options.defaultModel ||
      process.env.ANTHROPIC_MODEL_ANALYSIS ||
      "claude-3-5-sonnet-20241022";
  }

  async complete(prompt: string, options: LLMCompletionOptions = {}): Promise<string> {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens ?? 4000;
    const temperature = options.temperature ?? 0.2;

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: options.systemPrompt,
        messages: [{ role: "user", content: prompt }],
      });

      const firstBlock = response.content[0];
      if (firstBlock && firstBlock.type === "text") {
        return firstBlock.text;
      }
      return "";
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ProviderError("AnthropicClaude", msg);
    }
  }

  async stream(
    prompt: string,
    onToken: (token: string) => void,
    options: LLMCompletionOptions = {}
  ): Promise<{ fullText: string; totalTokens?: number }> {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens ?? 4000;
    const temperature = options.temperature ?? 0.2;

    let fullText = "";

    try {
      const stream = await this.client.messages.stream({
        model,
        max_tokens: maxTokens,
        temperature,
        system: options.systemPrompt,
        messages: [{ role: "user", content: prompt }],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          const text = chunk.delta.text;
          fullText += text;
          onToken(text);
        }
      }

      const finalMessage = await stream.finalMessage();
      return {
        fullText,
        totalTokens: finalMessage.usage.output_tokens,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ProviderError("AnthropicClaudeStream", msg);
    }
  }
}


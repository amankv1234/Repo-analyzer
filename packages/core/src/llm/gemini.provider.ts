import { LLMCompletionOptions, LLMProvider } from "./provider.interface";
import { ProviderError } from "@repomentor/shared";

export interface GeminiProviderOptions {
  apiKey?: string;
  defaultModel?: string;
  timeoutMs?: number;
}

/**
 * Google Gemini LLM Provider using native Node.js 22 fetch against Google AI Studio's Gemini REST API.
 * Free tier friendly, zero external SDK dependencies, supports gemini-1.5-flash and gemini-2.0-flash.
 */
export class GeminiProvider implements LLMProvider {
  public readonly providerName = "gemini";
  private apiKey: string;
  private defaultModel: string;
  private timeoutMs: number;

  constructor(options: GeminiProviderOptions = {}) {
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || "";
    this.defaultModel = options.defaultModel || process.env.GEMINI_MODEL || "gemini-3.8-flash";
    this.timeoutMs = options.timeoutMs ?? 60_000;
  }

  async complete(prompt: string, options: LLMCompletionOptions = {}): Promise<string> {
    if (!this.apiKey) {
      throw new ProviderError(
        "Gemini",
        "GEMINI_API_KEY environment variable is missing. Get a free API key at https://aistudio.google.com"
      );
    }

    const model = options.model || this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const body: Record<string, unknown> = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxTokens ?? 4000,
        responseMimeType: options.responseFormat === "json" ? "application/json" : "text/plain",
      },
    };

    if (options.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        throw new Error(`Gemini API error (${res.status}): ${errorBody}`);
      }

      interface GeminiResponsePayload {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      }

      const data = (await res.json()) as GeminiResponsePayload;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || "";
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ProviderError("Gemini", msg);
    }
  }

  async stream(
    prompt: string,
    onToken: (token: string) => void,
    options: LLMCompletionOptions = {}
  ): Promise<{ fullText: string; totalTokens?: number }> {
    if (!this.apiKey) {
      throw new ProviderError(
        "GeminiStream",
        "GEMINI_API_KEY environment variable is missing. Get a free API key at https://aistudio.google.com"
      );
    }

    const model = options.model || this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const body: Record<string, unknown> = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxTokens ?? 4000,
      },
    };

    if (options.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    let fullText = "";

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        throw new Error(`Gemini stream error (${res.status}): ${errorBody}`);
      }

      if (!res.body) {
        throw new Error("No response body received from Gemini stream API");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let isReading = true;
      while (isReading) {
        const { done, value } = await reader.read();
        if (done) {
          isReading = false;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawJson = line.slice(6).trim();
            if (!rawJson) continue;
            try {
              const parsed = JSON.parse(rawJson);
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) {
                fullText += textChunk;
                onToken(textChunk);
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      return {
        fullText,
        totalTokens: Math.ceil(fullText.length / 4),
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ProviderError("GeminiStream", msg);
    }
  }
}

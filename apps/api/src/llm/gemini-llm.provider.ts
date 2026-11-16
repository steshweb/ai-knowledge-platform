import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { LlmProvider } from './llm-provider';

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: unknown }>;
    };
  }>;
};

@Injectable()
export class GeminiLlmProvider implements LlmProvider {
  readonly model = (process.env.GEMINI_GENERATION_MODEL ?? 'gemini-3.5-flash-lite').replace(
    /^models\//,
    '',
  );

  async generateText(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'replace-with-your-gemini-api-key') {
      throw new ServiceUnavailableException('Gemini API key is not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ServiceUnavailableException(
        `Gemini generation request failed (${response.status}): ${errorBody.slice(0, 300)}`,
      );
    }

    const body = (await response.json()) as GeminiGenerateResponse;
    const answer = body.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('')
      .trim();

    if (!answer) throw new ServiceUnavailableException('Gemini returned an empty answer');
    return answer;
  }
}

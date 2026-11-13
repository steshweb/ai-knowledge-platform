import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { EmbeddingProvider } from './embedding-provider';

type GeminiEmbedding = { values?: unknown };

type GeminiBatchResponse = {
  embeddings?: GeminiEmbedding[];
};

@Injectable()
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly model = (process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001').replace(
    /^models\//,
    '',
  );
  readonly dimensions = Number(process.env.GEMINI_EMBEDDING_DIMENSIONS ?? 768);

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'replace-with-your-gemini-api-key') {
      throw new ServiceUnavailableException('Gemini API key is not configured');
    }
    if (!Number.isInteger(this.dimensions) || this.dimensions <= 0) {
      throw new ServiceUnavailableException('Gemini embedding dimensions are invalid');
    }

    const embeddings: number[][] = [];
    const batchSize = 100;

    for (let start = 0; start < texts.length; start += batchSize) {
      const batch = texts.slice(start, start + batchSize);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:batchEmbedContents`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            requests: batch.map((text) => ({
              model: `models/${this.model}`,
              content: { parts: [{ text }] },
              embedContentConfig: {
                taskType: 'RETRIEVAL_DOCUMENT',
                outputDimensionality: this.dimensions,
              },
            })),
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ServiceUnavailableException(
          `Gemini embedding request failed (${response.status}): ${errorBody.slice(0, 300)}`,
        );
      }

      const body = (await response.json()) as GeminiBatchResponse;
      const batchEmbeddings = body.embeddings?.map((embedding) => embedding.values);
      if (
        !batchEmbeddings ||
        batchEmbeddings.length !== batch.length ||
        batchEmbeddings.some(
          (values) =>
            !Array.isArray(values) ||
            values.length < this.dimensions ||
            values.some((value) => typeof value !== 'number' || !Number.isFinite(value)),
        )
      ) {
        const receivedDimensions = batchEmbeddings?.map((values) =>
          Array.isArray(values) ? values.length : 0,
        );
        throw new ServiceUnavailableException(
          `Gemini returned an invalid embedding response: expected ${batch.length} vectors with at least ${this.dimensions} values, received ${JSON.stringify(receivedDimensions)}`,
        );
      }

      embeddings.push(
        ...(batchEmbeddings as number[][]).map((values) => values.slice(0, this.dimensions)),
      );
    }

    return embeddings;
  }
}

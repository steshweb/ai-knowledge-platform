export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');

export interface EmbeddingProvider {
  readonly model: string;
  readonly dimensions: number;

  embedDocuments(texts: string[]): Promise<number[][]>;
}

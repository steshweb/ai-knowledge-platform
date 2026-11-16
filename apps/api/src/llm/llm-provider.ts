export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmProvider {
  readonly model: string;

  generateText(prompt: string): Promise<string>;
}

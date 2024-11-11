import {
  Chunks,
  LLMResponse,
  Messages,
  SupportedLLMs,
} from "../types";

// for non streaming responses
export interface ClientService {
  generateCompletion(
    messages: Messages,
    model?: SupportedLLMs,
    maxTokens?: number,
    temperature?: number,
    systemPrompt?: string,
    tools?: any
  ): Promise<LLMResponse>;

  // For streaming responses
  generateStreamCompletion(
    messages: Messages,
    model?: SupportedLLMs,
    maxTokens?: number,
    temperature?: number,
    systemPrompt?: string,
    tools?: any,
    stream?: boolean
  ): AsyncGenerator<Chunks, void, unknown>;
}

// GENERAL
export enum Providers {
  OPENAI = "OpenAI",
  ANTHROPIC_BEDROCK = "AnthropicBedrock",
  COHERE_BEDROCK = "CohereBedrock", // NOTE: not supported  yet
}

// OPENAI
export enum OpenAIMessagesRoles {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  TOOL = "tool",
  FUNCTION = "function",
}

export type OpenAISystemMessage = {
  role: OpenAIMessagesRoles.SYSTEM;
  content: string;
};

export type OpenAIUserMessage = {
  role: OpenAIMessagesRoles.USER;
  content: string;
};

export type OpenAIAssistantMessage = {
  role: OpenAIMessagesRoles.ASSISTANT;
  content: string;
};

export type OpenAIToolMessage = {
  role: OpenAIMessagesRoles.TOOL;
  content: string;
  tool_call_id: string;
};

export type OpenAIFunctionMessage = {
  role: OpenAIMessagesRoles.FUNCTION;
  content: string;
  name: string;
};

export type OpenAIMessage =
  | OpenAISystemMessage
  | OpenAIUserMessage
  | OpenAIAssistantMessage
  | OpenAIToolMessage
  | OpenAIFunctionMessage;

export type OpenAIMessages = OpenAIMessage[];

export enum OpenAISupportedLLMs {
  GPT_4_O_LAEST = "chatgpt-4o-latest", // points to the latest version of gpt-4o
  GPT_4_O = "gpt-4o",
  GPT_4_O_MINI = "gpt-4o-mini",
  GPT_4_TURBO = "gpt-4-turbo",
  GPT_4_TURBO_PREVIEW = "gpt-4-turbo-preview", // its same  as gpt-4-turbo-2024-04-09
  GPT_3_5_TURBO = "gpt-3.5-turbo", // its same as gpt-3.5-turbo-0125
}

export interface OpenAIChoices {
  index: number;
  message: any; // TODO: update this guys types as well
  logprobs: any; // TODO: define logprobs type
  finish_reason: string;
}

export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details: any; // TODO: define type
  completion_tokens_details: any; // TODO: define type
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    logprobs: null | object;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details: { cached_tokens: number };
    completion_tokens_details: { reasoning_tokens: number };
  };
  system_fingerprint: string;
}

// AWS BEDROCK

// AWS BEDROCK ANTHROPIC

export enum BedrockAnthropicSupportedLLMs {
  CLAUDE_3_HAIKU = "anthropic.claude-3-haiku-20240307-v1:0",
  CLAUDE_3_SONNET = "anthropic.claude-3-sonnet-20240229-v1:0",
  CLAUDE_3_OPUS = "anthropic.claude-3-opus-20240229-v1:0",
  CLAUDE_3_5_SONNET = "anthropic.claude-3-5-sonnet-20241022-v2:0",
}

export enum BedrockAnthropicContentType {
  TEXT = "text",
  IMAGE = "image",
  TOOL_USE = "tool_use",
  TOOL_RESULT = "tool_result",
}

export enum BedrockAnthropicMessageRole {
  USER = "user",
  ASSISTANT = "assistant",
}

export interface BedrockAnthropicToolUseContent {
  type: BedrockAnthropicContentType.TOOL_USE;
  id: string;
  name: string;
  input: any;
}

export interface BedrockAnthropicTextContent {
  type: BedrockAnthropicContentType.TEXT;
  text: string;
}

interface BedrockAnthropicImageContent {
  type: BedrockAnthropicContentType.IMAGE;
  source: {
    type: string;
    media_type: string;
    data: string;
  };
}
export interface BedrockAnthropicToolResultContent {
  type: BedrockAnthropicContentType.TOOL_RESULT;
  content: string;
}

export type BedrockAnthropicContent =
  | BedrockAnthropicToolUseContent
  | BedrockAnthropicToolResultContent
  | BedrockAnthropicTextContent
  | BedrockAnthropicImageContent;

export interface BedrockAnthropicMessage {
  role: BedrockAnthropicMessageRole;
  content: BedrockAnthropicContent[];
}

export interface BedrockAnthropicFunctionCall {
  id: string;
  name: string;
  arguments: string;
}

export type BedrockAnthropicMessages = BedrockAnthropicMessage[];

export interface BedrockAnthropicOptions {
  outputTokenLength: number;
  temperature: number;
  systemPrompt: string;
  messages: BedrockAnthropicMessages;
  tools: any;
}

export interface BedrockAnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface BedrockAnthropicResponse {
  id: string;
  type: "message";
  role: BedrockAnthropicMessageRole;
  model: string;
  content: BedrockAnthropicContent[];
  stop_reason: string;
  stop_sequence: string;
  usage: BedrockAnthropicUsage;
}

export interface BedrockAnthropicMessageChunk {
  id: string;
  type: "message";
  model: string;
  role: BedrockAnthropicMessageRole;
  content: BedrockAnthropicContent[];
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: BedrockAnthropicUsage;
}

export interface BedrockAnthropicContentBlock {
  type: string;
  text: string;
  name?: string;
  id?: string;
  partial_json?: string;
}

export interface BedrockAnthropicMetrics {
  inputTokenCount: number;
  outputTokenCount: number;
  invocationLatency: number;
  firstByteLatency: number;
}

export type BedrockAnthropicParsedChunk = {
  type: string;
  message?: BedrockAnthropicMessageChunk;
  content_block?: BedrockAnthropicContentBlock;
  delta?: BedrockAnthropicContentBlock;
  "amazon-bedrock-invocationMetrics"?: BedrockAnthropicMetrics;
};

// AWS BEDROCK LLAMA

export enum BedrockLlamaSupportedLLMs {
  LLAMA_3_2_90B = "llama.llama-3-2-90b-20240307-v1:0",
  LLAMA_3_2_11B = "llama.llama-3-2-11b-20240229-v1:0",
  LLAMA_3_2_3B = "llama.llama-3-2-3b-20240229-v1:0",
  LLAMA_3_2_1B = "llama.llama-3-2-1b-20241022-v2:0",
  LLAMA_3_1_405B = "llama.llama-3-1-405b-20240307-v1:0",
  LLAMA_3_1_70B = "llama.llama-3-1-70b-20240229-v1:0",
  LLAMA_3_1_8B = "llama.llama-3-1-8b-20241022-v2:0",
}

export enum BedrockLlamaContentType {
  TEXT = "text",
  IMAGE = "image",
}

export enum BedrockLlamaMessageRole {
  USER = "user",
  ASSISTANT = "assistant",
}

export interface BedrockLlamaTextContent {
  type: BedrockLlamaContentType.TEXT;
  text: string;
}

interface BedrockLlamaImageContent {
  type: BedrockLlamaContentType.IMAGE;
  source: {
    type: string;
    media_type: string;
    data: string;
  };
}

export type BedrockLlamaContent =
  | BedrockLlamaTextContent
  | BedrockLlamaImageContent;

export interface BedrockLlamaMessage {
  role: BedrockLlamaMessageRole;
  content: BedrockLlamaContent[];
}

export interface BedrockLlamaFunctionCall {
  id: string;
  name: string;
  arguments: string;
}

export type BedrockLlamaMessages = BedrockLlamaMessage[];

export interface BedrockLlamaOptions {
  outputTokenLength: number;
  temperature: number;
  systemPrompt: string;
  messages: BedrockLlamaMessages;
  tools: any;
}

export interface BedrockLlamaUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface BedrockLlamaResponse {
  id: string;
  type: "message";
  role: BedrockLlamaMessageRole;
  model: string; //I might need to change this to string
  content: BedrockLlamaContent[];
  stop_reason: string | null; 
  stop_sequence: string | null;
  usage: BedrockLlamaUsage;
  created_at?: number; 
  error?: { 
    type: string;
    message: string;
  };
}


export interface BedrockLlamaMessageChunk {
  id: string;
  type: "message";
  model: string;
  role: BedrockLlamaMessageRole;
  content: BedrockLlamaContent[];
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: BedrockLlamaUsage;
}

export interface BedrockLlamaContentBlock {
  type: string;
  text: string;
  name?: string;
  id?: string;
  partial_json?: string;
}

export interface BedrockLlamaMetrics {
  inputTokenCount: number;
  outputTokenCount: number;
  invocationLatency: number;
  firstByteLatency: number;
}

export type BedrockLlamaParsedChunk = {
  type: string;
  message?: BedrockLlamaMessageChunk;
  content_block?: BedrockLlamaContentBlock;
  delta?: BedrockLlamaContentBlock;
  "amazon-bedrock-invocationMetrics"?: BedrockLlamaMetrics;
};

export interface BedrockLlamaError {
  type: string;
  message: string;
  code?: string;
  param?: string;
  status?: number;
}

// GENERAL
export type Messages = OpenAIMessages | BedrockAnthropicMessages | BedrockLlamaMessages;
export type LLMResponse = OpenAIResponse | BedrockAnthropicResponse | BedrockLlamaResponse;
export type LlmError = BedrockLlamaError;
export type Chunks = BedrockLlamaParsedChunk | BedrockAnthropicParsedChunk;

export type SupportedLLMs =
  | { type: "OpenAI"; model: OpenAISupportedLLMs }
  | { type: "BedrockAnthropic"; model: BedrockAnthropicSupportedLLMs }
  | { type: "BedrockLlama"; model: BedrockLlamaSupportedLLMs };

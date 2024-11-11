import { ProviderFinder } from "./middleware/ProviderFinder";
import { InputFormatAdapter } from "./middleware/InputFormatAdapter";
import { OutputFormatAdapter } from "./middleware/OutputFormatAdapter";
import { AwsBedrockAnthropicService } from "./services/AwsBedrockAnthropicService";
import { AWSBedrockLlamaService } from "./services/AWSBedrockLlamaService";
import { OpenAIService } from "./services/OpenAIService";
import {
  Messages,
  SupportedLLMs,
  OpenAIResponse,
  Providers,
  OpenAIMessages,
  BedrockAnthropicMessages,
  BedrockLlamaMessages,
} from "./types";

// Define the credentials interface for flexibility
interface Credentials {
  apiKey?: string;
  awsConfig?: { accessKeyId: string; secretAccessKey: string; region: string };
}

// Main function for non-streaming requests
export async function generateLLMResponse(
  messages: Messages,
  model: SupportedLLMs,
  maxTokens: number,
  temperature: number,
  systemPrompt: string,
  tools: any,
  credentials: Credentials
): Promise<OpenAIResponse> {
  // Step 2: Identify the provider based on the model
  const provider = ProviderFinder.getProvider(model);

  // Initialize the correct service based on the provider
  let service: OpenAIService | AwsBedrockAnthropicService | AWSBedrockLlamaService;
  if (provider === Providers.OPENAI) {
    if (!credentials.apiKey) {
      throw new Error("OpenAI API key is required for OpenAI models.");
    }
    service = new OpenAIService(credentials.apiKey);
  } else if (provider === Providers.ANTHROPIC_BEDROCK) {
    const awsConfig = credentials.awsConfig;
    if (!awsConfig) {
      throw new Error("AWS credentials are required for Bedrock models.");
    }
    service = new AwsBedrockAnthropicService(
      awsConfig.accessKeyId,
      awsConfig.secretAccessKey,
      awsConfig.region
    );
  }
  else if (provider === Providers.LLAMA_BEDROCK) {
    const awsConfig = credentials.awsConfig;
    if (!awsConfig) {
      throw new Error("AWS credentials are required for Llama models.");
    }
    service = new AWSBedrockLlamaService(
      awsConfig.accessKeyId,
      awsConfig.secretAccessKey,
      awsConfig.region
    );
  }  
  else {
    throw new Error("Unsupported provider");
  }

  // Step 3: If the provider is not OpenAI, adapt the input to provider format
  const adaptedMessages =
    provider !== Providers.OPENAI
      ? InputFormatAdapter.adaptMessages(messages, provider)
      : messages;

  // TODO: Add support for bedrock llama here
  const response = await service.generateCompletion(
    provider === Providers.OPENAI
      ? (messages as OpenAIMessages)
      : (messages as BedrockAnthropicMessages as any),
    model,
    maxTokens,
    temperature,
    systemPrompt,
    tools
  );

  // Adapt the response if provider is not OpenAI
  return provider === Providers.OPENAI
    ? (response as OpenAIResponse)
    : (OutputFormatAdapter.adaptResponse(response, provider) as OpenAIResponse);
}

// Main function for streaming requests
export async function generateLLMStreamResponse(
  messages: Messages,
  model: SupportedLLMs,
  maxTokens: number,
  temperature: number,
  systemPrompt: string,
  tools: any,
  credentials: Credentials
): Promise<AsyncGenerator<OpenAIResponse>> {
  const provider = ProviderFinder.getProvider(model);

  let service: OpenAIService | AwsBedrockAnthropicService | AWSBedrockLlamaService;
  if (provider === Providers.OPENAI) {
    if (!credentials.apiKey) {
      throw new Error("OpenAI API key is required for OpenAI models.");
    }
    service = new OpenAIService(credentials.apiKey);
  } else if (provider === Providers.ANTHROPIC_BEDROCK) {
    const awsConfig = credentials.awsConfig;
    if (!awsConfig) {
      throw new Error("AWS credentials are required for Bedrock models.");
    }
    service = new AwsBedrockAnthropicService(
      awsConfig.accessKeyId,
      awsConfig.secretAccessKey,
      awsConfig.region
    );
  }
  else if (provider === Providers.LLAMA_BEDROCK) {
    const awsConfig = credentials.awsConfig;
    if (!awsConfig) {
      throw new Error("AWS credentials are required for Llama models.");
    }
    service = new AWSBedrockLlamaService(
      awsConfig.accessKeyId,
      awsConfig.secretAccessKey,
      awsConfig.region
    );
  }
  else {
    throw new Error("Unsupported provider");
  }

  const adaptedMessages =
    provider !== Providers.OPENAI
      ? InputFormatAdapter.adaptMessages(messages, provider)
      : messages;

  // TODO: Add support for bedrock llama stream here
  const stream = service.generateStreamCompletion(
    provider === Providers.OPENAI
      ? (messages as OpenAIMessages)
      : (messages as BedrockAnthropicMessages as any),
    model,
    maxTokens,
    temperature,
    systemPrompt,
    tools,
    true
  );

  // Create and return the async generator
  async function* streamGenerator(): AsyncGenerator<OpenAIResponse> {
    for await (const chunk of stream) {
      yield provider === Providers.OPENAI
        ? (chunk as OpenAIResponse)
        : (OutputFormatAdapter.adaptResponse(
            chunk,
            provider
          ) as OpenAIResponse);
    }
  }

  return streamGenerator();
}

export * from "./types";

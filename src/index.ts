import { ProviderFinder } from "./middleware/ProviderFinder";
import { InputFormatAdapter } from "./middleware/InputFormatAdapter";
import { OutputFormatAdapter } from "./middleware/OutputFormatAdapter";
import { AwsBedrockAnthropicService } from "./services/AwsBedrockAnthropicService";
import { OpenAIService } from "./services/OpenAIService";
import {
  Messages,
  OpenAIResponse,
  Providers,
  OpenAIMessages,
  BedrockAnthropicMessages,
} from "./types";

// Define the credentials interface for flexibility
interface Credentials {
  apiKey?: string;
  awsConfig?: { accessKeyId: string; secretAccessKey: string; region: string };
}

// Main function for non-streaming requests
export async function generateLLMResponse(
  messages: Messages,
  model: string,
  maxTokens: number,
  temperature: number,
  credentials: Credentials
): Promise<OpenAIResponse> {
  // Step 1: Identify the provider based on the model
  const provider = ProviderFinder.getProvider(model);

  // Initialize the correct service based on the provider
  let service: OpenAIService | AwsBedrockAnthropicService;
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
  } else {
    throw new Error("Unsupported provider");
  }

  // Step 2: Adapt messages and extract the system prompt
  const { adaptedMessages, systemPrompt } = InputFormatAdapter.adaptMessages(
    messages,
    provider
  );

  // Step 3: Generate the completion
  const response = await service.generateCompletion(
    adaptedMessages as any, // TODO: fix this any
    model,
    maxTokens,
    temperature,
    systemPrompt
  );

  // Step 4: Adapt the response if needed
  return provider === Providers.OPENAI
    ? (response as OpenAIResponse)
    : (OutputFormatAdapter.adaptResponse(response, provider) as OpenAIResponse);
}

// Main function for streaming requests
export async function generateLLMStreamResponse(
  messages: Messages,
  model: string,
  maxTokens: number,
  temperature: number,
  credentials: Credentials
): Promise<AsyncGenerator<OpenAIResponse>> {
  const provider = ProviderFinder.getProvider(model);

  // Initialize the correct service based on the provider
  let service: OpenAIService | AwsBedrockAnthropicService;
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
  } else {
    throw new Error("Unsupported provider");
  }

  // Adapt messages and extract the system prompt
  const { adaptedMessages, systemPrompt } = InputFormatAdapter.adaptMessages(
    messages,
    provider
  );

  // Generate the streaming completion
  const stream = service.generateStreamCompletion(
    adaptedMessages as any, // TODO: Fix this any
    model,
    maxTokens,
    temperature,
    systemPrompt
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

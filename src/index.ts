import { GenerateLLMResponseParams, OpenAIResponse, Providers } from "./types";
import ProviderFinder from "./middleware/ProviderFinder";
import InputFormatAdapter from "./middleware/InputFormatAdapter";
import OutputFormatAdapter from "./middleware/OutputFormatAdapter";
import initializeProviderService from "./utils/initializeProviderService";

// Main function for non-streaming requests
export async function generateLLMResponse(
  params: GenerateLLMResponseParams
): Promise<OpenAIResponse> {
  const { messages, model, functions, max_tokens, temperature, credentials } =
    params;

  const provider = ProviderFinder.getProvider(model);
  const service = initializeProviderService(provider, credentials);

  const { adaptedMessages, systemPrompt } = InputFormatAdapter.adaptMessages(
    messages,
    provider
  );

  const response = await service.generateCompletion({
    messages: adaptedMessages,
    model,
    max_tokens,
    temperature: temperature || 0,
    tools: functions,
    systemPrompt,
  });

  return provider === Providers.OPENAI
    ? (response as OpenAIResponse)
    : (OutputFormatAdapter.adaptResponse(response, provider) as OpenAIResponse);
}

// Main function for streaming requests
export async function generateLLMStreamResponse(
  params: GenerateLLMResponseParams
): Promise<AsyncGenerator<OpenAIResponse>> {
  const { messages, model, functions, max_tokens, temperature, credentials } =
    params;

  const provider = ProviderFinder.getProvider(model);
  const service = initializeProviderService(provider, credentials);

  const { adaptedMessages, systemPrompt } = InputFormatAdapter.adaptMessages(
    messages,
    provider
  );

  const stream = service.generateStreamCompletion({
    messages: adaptedMessages,
    model,
    max_tokens,
    temperature: temperature || 0,
    tools: functions,
    systemPrompt,
  });

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

import {
  BedrockAnthropicParsedChunk,
  BedrockAnthropicResponse,
  Messages,
  SupportedLLMs,
} from "../types";
import {
  InvokeModelCommand,
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { ClientService } from "./ClientService";

export class AwsBedrockAnthropicService implements ClientService {
  private bedrock: BedrockRuntimeClient;

  constructor(awsAccessKey: string, awsSecretKey: string, region: string) {
    this.bedrock = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey,
      },
    });
  }

  async generateCompletion(
    messages: Messages,
    model?: SupportedLLMs,
    maxTokens?: number,
    temperature?: number,
    systemPrompt?: string,
    tools?: any
  ): Promise<BedrockAnthropicResponse> {
    const modelId =
      model?.type === "BedrockAnthropic" ? model.model : undefined;
    if (!modelId) {
      throw new Error("Invalid model type for AwsBedrockAnthropicService");
    }

    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      temperature,
      messages,
      system: systemPrompt,
      ...(tools && tools.length > 0 ? { tools } : {}),
    });

    const command = new InvokeModelCommand({
      modelId,
      body,
      contentType: "application/json",
      accept: "application/json",
    });

    const response = await this.bedrock.send(command);
    return JSON.parse(new TextDecoder().decode(response.body));
  }

  async *generateStreamCompletion(
    messages: Messages,
    model?: SupportedLLMs,
    maxTokens?: number,
    temperature?: number,
    systemPrompt?: string,
    tools?: any,
    stream?: boolean
  ): AsyncGenerator<BedrockAnthropicParsedChunk, void, unknown> {
    const modelId =
      model?.type === "BedrockAnthropic" ? model.model : undefined;
    if (!modelId) {
      throw new Error("Invalid model type for AwsBedrockAnthropicService");
    }

    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      temperature,
      messages,
      system: systemPrompt,
      ...(tools && tools.length > 0 ? { tools } : {}),
    });

    const command = new InvokeModelWithResponseStreamCommand({
      modelId,
      body,
      contentType: "application/json",
      accept: "application/json",
    });

    const response = await this.bedrock.send(command);

    if (response.body) {
      const decoder = new TextDecoder("utf-8");

      for await (const payload of response.body) {
        const decodedString = decoder.decode(payload.chunk?.bytes, {
          stream: true,
        });

        try {
          const jsonObject = JSON.parse(decodedString);
          yield jsonObject;
        } catch (error) {
          console.error("Failed to parse chunk as JSON:", error);
        }
      }
    }
  }
}

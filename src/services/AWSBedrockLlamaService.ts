import {
    BedrockLlamaParsedChunk,
    BedrockLlamaResponse,
    Messages,
    SupportedLLMs,
    LlmError,
  } from "../types";
  import {
    InvokeModelCommand,
    BedrockRuntimeClient,
    InvokeModelWithResponseStreamCommand,
  } from "@aws-sdk/client-bedrock-runtime";
  import { ClientService } from "./ClientService";

export class AWSBedrockLlamaService implements ClientService
{
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
        systemPrompt?: string
    ): Promise<BedrockLlamaResponse> {

        const modelId = model?.type === "BedrockLlama" ? model.model : undefined;
        
        if (!modelId) {
          throw new Error("Invalid model type for AwsBedrockLlamaService");
        }
      
        const body = JSON.stringify({
          max_tokens: maxTokens,
          temperature,
          messages,
          system: systemPrompt,
        });
      
        const command = new InvokeModelCommand({
          modelId,
          body,
          contentType: "application/json",
          accept: "application/json",
        });
      
        try {
          const response = await this.bedrock.send(command);
          return JSON.parse(new TextDecoder().decode(response.body));
        } 
        catch (error:any) {
          const bedrockError: LlmError = {
            type: "BedrockLlamaError",
            message: error.message,
            code: error.code,
            param: error.param,
            status: error.status,
          };
          console.error("Bedrock Llama completion error:", bedrockError);
          throw bedrockError;
        }
    }

    async *generateStreamCompletion(
        messages: Messages,
        model?: SupportedLLMs,
        maxTokens?: number,
        temperature?: number,
        systemPrompt?: string,
        stream?: boolean
      ): AsyncGenerator<BedrockLlamaParsedChunk, void, unknown> {
        const modelId = model?.type === "BedrockLlama" ? model.model : undefined;
        if (!modelId) {
          throw new Error("Invalid model type for AwsBedrockLlamaService");
        }
      
        const body = JSON.stringify({
          max_tokens: maxTokens,
          temperature,
          messages,
          system: systemPrompt,
        });
      
        const command = new InvokeModelWithResponseStreamCommand({
          modelId,
          body,
          contentType: "application/json",
          accept: "application/json",
        });
      
        try {
          const response = await this.bedrock.send(command);
      
          if (response.body) {
            const decoder = new TextDecoder("utf-8");
      
            for await (const payload of response.body) {
              const decodedString = decoder.decode(payload.chunk?.bytes, {
                stream: true,
              });
      
              try {
                const jsonObject: BedrockLlamaParsedChunk = JSON.parse(decodedString);
                yield jsonObject;
              } catch (error: any) {
                const bedrockError: LlmError = {
                  type: "BedrockLlamaError",
                  message: error.message,
                  code: error.code,
                  param: error.param,
                  status: error.status,
                };
                console.error("Failed to parse Llama chunk as JSON:", bedrockError);
              }
            }
          }
        } catch (error: any) {
          const bedrockError: LlmError = {
            type: "BedrockLlamaError",
            message: error.message,
            code: error.code,
            param: error.param,
            status: error.status,
          };
          console.error("Bedrock Llama stream error:", bedrockError);
          throw bedrockError;
        }
      }
      

    
}


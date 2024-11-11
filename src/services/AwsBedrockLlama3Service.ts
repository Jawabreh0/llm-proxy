import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

export class AwsBedrockLlama3Service {
  private client: BedrockRuntimeClient;

  constructor(accessKeyId: string, secretAccessKey: string, region: string) {
    this.client = new BedrockRuntimeClient({
      credentials: { accessKeyId, secretAccessKey },
      region,
    });
  }

  private formatPrompt(
    userMessage: string,
    systemMessage: string = "You are a helpful assistant, you name is Lily and your a  Computer Engineer"
  ) {
    return `
<|begin_of_text|><|start_header_id|>system<|end_header_id|>
${systemMessage}
<|eot_id|>
<|start_header_id|>user<|end_header_id|>
${userMessage}
<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>
`;
  }

  async generateCompletion(
    prompt: string,
    model: string,
    max_gen_len: number = 512,
    temperature: number = 0.5,
    top_p: number = 0.9
  ) {
    const request = {
      prompt: this.formatPrompt(prompt),
      max_gen_len,
      temperature,
      top_p,
    };

    const input = {
      modelId: model,
      contentType: "application/json",
      body: JSON.stringify(request),
    };

    const command = new InvokeModelCommand(input);
    const response = await this.client.send(command);
    const responseBody = new TextDecoder().decode(response.body);
    return JSON.parse(responseBody);
  }

  async *generateStreamCompletion(
    prompt: string,
    model: string,
    max_gen_len: number = 512,
    temperature: number = 0.5,
    top_p: number = 0.9
  ) {
    const request = {
      prompt: this.formatPrompt(prompt),
      max_gen_len,
      temperature,
      top_p,
    };

    const input = {
      modelId: model,
      contentType: "application/json",
      body: JSON.stringify(request),
    };

    const command = new InvokeModelWithResponseStreamCommand(input);
    const response = await this.client.send(command);

    if (!response.body) {
      throw new Error("No response body received");
    }

    for await (const event of response.body) {
      if (event.chunk?.bytes) {
        const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
        if (chunk.generation) {
          yield chunk;
        }
      }
    }
  }
}

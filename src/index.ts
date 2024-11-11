import { ProviderFinder } from "./middleware/ProviderFinder";
import { InputFormatAdapter } from "./middleware/InputFormatAdapter";
import { OutputFormatAdapter } from "./middleware/OutputFormatAdapter";
import { AwsBedrockAnthropicService } from "./services/AwsBedrockAnthropicService";
import { OpenAIService } from "./services/OpenAIService";
import {
  Messages,
  SupportedLLMs,
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

  // Step 3: If the provider is not OpenAI, adapt the input to provider format
  const adaptedMessages =
    provider !== Providers.OPENAI
      ? InputFormatAdapter.adaptMessages(messages, provider)
      : messages;

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

  const adaptedMessages =
    provider !== Providers.OPENAI
      ? InputFormatAdapter.adaptMessages(messages, provider)
      : messages;

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

// import { AwsBedrockLlama3Service } from "./services/AwsBedrockLlama3Service";
// import readline from "readline";
// import dotenv from "dotenv";

// dotenv.config();

// interface Message {
//   role: "user" | "assistant";
//   content: string;
// }

// class CliChat {
//   private llmService: AwsBedrockLlama3Service;
//   private rl: readline.Interface;
//   private messages: Message[] = [];

//   constructor() {
//     this.llmService = new AwsBedrockLlama3Service(
//       process.env.AWS_ACCESS_KEY_ID!,
//       process.env.AWS_SECRET_ACCESS_KEY!,
//       process.env.AWS_REGION!
//     );

//     this.rl = readline.createInterface({
//       input: process.stdin,
//       output: process.stdout,
//     });
//   }

//   private formatPrompt(): string {
//     let prompt = "";

//     for (const msg of this.messages) {
//       prompt += `<|begin_of_text|><|start_header_id|>${msg.role}<|end_header_id|>\n${msg.content}\n<|eot_id|>\n`;
//     }

//     // Add the final assistant header
//     prompt += "<|start_header_id|>assistant<|end_header_id|>\n";

//     return prompt;
//   }

//   private async getStreamingResponse(userInput: string) {
//     // Add user message to history
//     this.messages.push({ role: "user", content: userInput });

//     // Format the entire conversation history
//     const prompt = this.formatPrompt();

//     const generator = this.llmService.generateStreamCompletion(
//       prompt,
//       "meta.llama3-70b-instruct-v1:0",
//       512,
//       0.7
//     );

//     process.stdout.write("\nAssistant: ");
//     let fullResponse = "";

//     try {
//       for await (const chunk of generator) {
//         if (chunk.generation) {
//           process.stdout.write(chunk.generation);
//           fullResponse += chunk.generation;
//         }
//       }

//       // Add assistant's response to history
//       this.messages.push({ role: "assistant", content: fullResponse.trim() });

//       process.stdout.write("\n\n");
//     } catch (error) {
//       console.error("Error during streaming:", error);
//       process.stdout.write("\nError occurred during response generation.\n\n");
//     }
//   }

//   public async start() {
//     console.log('Welcome to the CLI Chat! Type "exit" to quit.\n');

//     const askQuestion = async () => {
//       this.rl.question("You: ", async (input) => {
//         if (input.toLowerCase() === "exit") {
//           console.log("\nGoodbye!");
//           this.rl.close();
//           return;
//         }

//         try {
//           await this.getStreamingResponse(input);
//           askQuestion();
//         } catch (error) {
//           console.error("Error:", error);
//           this.rl.close();
//         }
//       });
//     };

//     await askQuestion();
//   }

//   // Debug method to see what's being sent to the model
//   private logCurrentState() {
//     console.log("\nCurrent conversation state:");
//     console.log(this.formatPrompt());
//     console.log("\n");
//   }
// }

// // Start the chat
// const chat = new CliChat();

// // Add debug handler
// process.on("SIGUSR1", () => {
//   chat["logCurrentState"]();
// });

// chat.start().catch(console.error);

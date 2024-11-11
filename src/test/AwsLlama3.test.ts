import { BedrockLlama3SupportedLLMs } from "../types";
import { AwsBedrockLlama3Service } from "../services/AwsBedrockLlama3Service";
import dotenv from "dotenv";

dotenv.config();

describe("AwsBedrockLlama3Service", () => {
  let service: AwsBedrockLlama3Service;

  beforeAll(() => {
    service = new AwsBedrockLlama3Service(
      process.env.AWS_ACCESS_KEY_ID!,
      process.env.AWS_SECRET_ACCESS_KEY!,
      process.env.AWS_REGION!
    );
  });

  it("should return a completion for Llama 3 model", async () => {
    const prompt = "Hi, what is your name? respond with one word";

    const response = await service.generateCompletion(
      prompt,
      BedrockLlama3SupportedLLMs.LLAMA_3_8B
    );

    expect(response).toHaveProperty("generation");
    expect(response.generation).toBeTruthy();
  }, 15000);

  it("should stream completion for Llama 3 model", async () => {
    const prompt = "Hi, what is your name? respond with one word";
    let receivedChunks = 0;
    const generatedText: string[] = [];

    const generator = service.generateStreamCompletion(
      prompt,
      BedrockLlama3SupportedLLMs.LLAMA_3_8B
    );

    for await (const chunk of generator) {
      expect(chunk).toHaveProperty("generation");
      expect(typeof chunk.generation).toBe("string");
      generatedText.push(chunk.generation);
      receivedChunks++;
      if (receivedChunks >= 3) break; // Test first 3 chunks
    }

    expect(receivedChunks).toBeGreaterThan(0);
    console.log("Generated text:", generatedText.join(""));
  }, 15000);
});

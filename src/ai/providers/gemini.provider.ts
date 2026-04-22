import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { LoggerService } from "../../common/logger/logger.service";

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
  };
}

interface GeminiProviderResponse {
  text: string;
  status: number;
  data: GeminiResponse;
}

@Injectable()
export class GeminiProvider {
  constructor(private readonly logger: LoggerService) {}

  async complete(
    prompt: string,
    apiKey: string,
    model: string = "gemini-2.5-flash",
    apiUrl: string = "https://generativelanguage.googleapis.com/v1beta/models",
  ): Promise<GeminiProviderResponse> {
    const url = `${apiUrl}/${model}:generateContent?key=${apiKey}`;

    const payload: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    this.logger.log(
      `Sending request to Gemini API. Model: ${model}, URL: ${apiUrl}/${model}:generateContent, Prompt (excerpt): ${prompt.substring(0, 100)}...`,
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = (await response.json()) as GeminiResponse;
      this.logger.log(
        `Received response from Gemini API. data: ${JSON.stringify(data)}`,
      );

      if (response.status === 400) {
        throw new BadRequestException(data.error?.message);
      }

      if (
        !data.candidates?.[0]?.content?.parts?.[0]
      ) {
        this.logger.error(
          "Invalid response structure from Gemini API",
          "",
          GeminiProvider.name,
        );
        throw new BadGatewayException(
          "A IA retornou uma resposta em formato inesperado.",
        );
      }

      return {
        text: data.candidates[0].content.parts[0].text,
        status: response.status,
        data,
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        this.logger.error(
          "Gemini API request timed out after 30 seconds",
          "",
          GeminiProvider.name,
        );
        throw new ServiceUnavailableException(
          "O serviço de IA não respondeu a tempo. Tente novamente.",
        );
      }
      this.logger.error(
        `Error during Gemini API call: ${(error as Error).message}`,
        (error as Error).stack,
        GeminiProvider.name,
      );
      throw error;
    }
  }
}

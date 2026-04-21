import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger/logger.service';


interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

@Injectable()
export class GeminiProvider {
  constructor(private readonly logger: LoggerService) {

  }

  async complete(
    prompt: string,
    apiKey: string,
    model: string = 'gemini-1.5-flash',
    apiUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models',
  ): Promise<string> {
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

    this.logger.log(`Sending request to Gemini API. Model: ${model}, URL: ${apiUrl}/${model}:generateContent, Prompt (excerpt): ${prompt.substring(0, 100)}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal, // Associate the abort controller with the request
      });

      clearTimeout(timeoutId); // Clear the timeout if the request completes in time

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Gemini API responded with status ${response.status}: ${errorText}`, '', GeminiProvider.name);
        throw new Error(`Gemini API responded with status ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as GeminiResponse;
      this.logger.log(`Received successful response from Gemini API. Status: ${response.status}`);

      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content.parts[0]
      ) {
        this.logger.error('Invalid response structure from Gemini API', '', GeminiProvider.name);
        throw new Error('Invalid response structure from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error('Gemini API request timed out after 30 seconds', '', GeminiProvider.name);
        throw new Error('Gemini API request timed out after 30 seconds');
      }
      this.logger.error(`Error during Gemini API call: ${(error as Error).message}`, (error as Error).stack, GeminiProvider.name);
      throw error;
    }
  }
}

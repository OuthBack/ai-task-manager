import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

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
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 second timeout
    });
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

    const response = await this.axiosInstance.post<GeminiResponse>(
      url,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (
      !response.data.candidates ||
      !response.data.candidates[0] ||
      !response.data.candidates[0].content.parts[0]
    ) {
      throw new Error('Invalid response structure from Gemini API');
    }

    return response.data.candidates[0].content.parts[0].text;
  }
}

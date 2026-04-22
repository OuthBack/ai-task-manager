import { Test, TestingModule } from "@nestjs/testing";
import { GeminiProvider } from "./gemini.provider";
import {
  BadGatewayException,
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { LoggerService } from "../../common/logger/logger.service";

// Mock the global fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock LoggerService
const mockLoggerService = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

describe("GeminiProvider", () => {
  let provider: GeminiProvider;
  let mockModule: TestingModule;

  const mockGeminiApiKey = "mock-gemini-api-key";
  const mockObjective = "Create a new task";
  const mockModel = "gemini-1.5-flash";
  const mockApiUrl = "https://generativelanguage.googleapis.com/v1beta/models";

  beforeEach(async () => {
    mockFetch.mockClear();
    mockLoggerService.log.mockClear();
    mockLoggerService.error.mockClear();

    mockModule = await Test.createTestingModule({
      providers: [
        GeminiProvider,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    provider = mockModule.get<GeminiProvider>(GeminiProvider);
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });

  // Test Case 1: Successful API call
  it("should successfully complete a request and return text", async () => {
    const mockResponseText = "This is a generated task.";
    const mockResponseJson = {
      candidates: [
        {
          content: {
            parts: [{ text: mockResponseText }],
          },
        },
      ],
    };
    const mockFetchResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponseJson),
      statusText: "OK",
    };
    mockFetch.mockResolvedValue(mockFetchResponse);

    const result = await provider.complete(
      mockObjective,
      mockGeminiApiKey,
      mockModel,
      mockApiUrl,
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("gemini-1.5-flash"),
      expect.objectContaining({
        method: "POST",
        body: expect.any(String),
        signal: expect.any(Object),
      }),
    );
    expect(mockLoggerService.log).toHaveBeenCalledWith(
      expect.stringContaining("Sending request to Gemini API"),
    );
    expect(mockLoggerService.log).toHaveBeenCalledWith(
      expect.stringContaining("Received response from Gemini API"),
    );
    expect(result.text).toBe(mockResponseText);
    expect(result.status).toBe(200);
    expect(result.data).toEqual(mockResponseJson);
  });

  // Test Case 2: Timeout error
  it("should throw ServiceUnavailableException on timeout", async () => {
    const mockAbortError = new Error("The operation was aborted");
    mockAbortError.name = "AbortError"; // Crucial for distinguishing timeout
    mockFetch.mockRejectedValue(mockAbortError);

    await expect(
      provider.complete(mockObjective, mockGeminiApiKey, mockModel, mockApiUrl),
    ).rejects.toThrow(ServiceUnavailableException);
    await expect(
      provider.complete(mockObjective, mockGeminiApiKey, mockModel, mockApiUrl),
    ).rejects.toThrow("O serviço de IA não respondeu a tempo. Tente novamente.");

    expect(mockLoggerService.error).toHaveBeenCalledWith(
      "Gemini API request timed out after 30 seconds",
      "",
      "GeminiProvider",
    );
  });

  // Test Case 3: Bad Request (400) error
  it("should throw BadRequestException on 400 status code", async () => {
    const mockErrorMessage = "Invalid API key provided";
    const mockResponseJson = {
      error: {
        code: 400,
        message: mockErrorMessage,
      },
    };
    const mockFetchResponse = {
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue(mockResponseJson),
      statusText: "Bad Request",
    };
    mockFetch.mockResolvedValue(mockFetchResponse);

    await expect(
      provider.complete(mockObjective, mockGeminiApiKey, mockModel, mockApiUrl),
    ).rejects.toThrow(BadRequestException);
    await expect(
      provider.complete(mockObjective, mockGeminiApiKey, mockModel, mockApiUrl),
    ).rejects.toThrow(mockErrorMessage);

    expect(mockLoggerService.log).toHaveBeenCalledWith(
      expect.stringContaining("Received response from Gemini API"),
    );
  });

  // Test Case 4: Invalid response structure (missing candidates)
  it("should throw BadGatewayException for invalid response structure (missing candidates)", async () => {
    const mockResponseJson = {
      // candidates field is missing
      someOtherField: "value",
    };
    const mockFetchResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponseJson),
      statusText: "OK",
    };
    mockFetch.mockResolvedValue(mockFetchResponse);

    await expect(
      provider.complete(mockObjective, mockGeminiApiKey, mockModel, mockApiUrl),
    ).rejects.toThrow(BadGatewayException);
    await expect(
      provider.complete(mockObjective, mockGeminiApiKey, mockModel, mockApiUrl),
    ).rejects.toThrow("A IA retornou uma resposta em formato inesperado.");

    expect(mockLoggerService.error).toHaveBeenCalledWith(
      "Invalid response structure from Gemini API",
      "",
      "GeminiProvider",
    );
  });

  // Test Case 5: Invalid response structure (missing content)
  it("should throw BadGatewayException for invalid response structure (missing content)", async () => {
    const mockResponseJson = {
      candidates: [
        {
          // content field is missing
        },
      ],
    };
    const mockFetchResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponseJson),
      statusText: "OK",
    };
    mockFetch.mockResolvedValue(mockFetchResponse);

    await expect(
      provider.complete(mockObjective, mockGeminiApiKey, mockModel, mockApiUrl),
    ).rejects.toThrow(BadGatewayException);
  });

  // Test Case 6: Invalid response structure (missing parts)
  it("should throw BadGatewayException for invalid response structure (missing parts)", async () => {
    const mockResponseJson = {
      candidates: [
        {
          content: {
            // parts field is missing
          },
        },
      ],
    };
    const mockFetchResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponseJson),
      statusText: "OK",
    };
    mockFetch.mockResolvedValue(mockFetchResponse);

    await expect(
      provider.complete(mockObjective, mockGeminiApiKey, mockModel, mockApiUrl),
    ).rejects.toThrow(BadGatewayException);
  });

  // Test Case 7: Other fetch errors
  it("should re-throw other fetch errors and log them", async () => {
    const genericError = new Error("Network Error");
    mockFetch.mockRejectedValue(genericError);

    await expect(
      provider.complete(mockObjective, mockGeminiApiKey, mockModel, mockApiUrl),
    ).rejects.toThrow("Network Error");

    expect(mockLoggerService.error).toHaveBeenCalledWith(
      "Error during Gemini API call: Network Error",
      genericError.stack,
      "GeminiProvider",
    );
  });

  // Test Case 8: Ensure URL is constructed correctly
  it("should construct the correct URL with model and api key", async () => {
    const mockFetchResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        candidates: [{ content: { parts: [{ text: "success" }] } }],
      }),
      statusText: "OK",
    };
    mockFetch.mockResolvedValue(mockFetchResponse);

    await provider.complete(
      mockObjective,
      mockGeminiApiKey,
      mockModel,
      mockApiUrl,
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        `https://generativelanguage.googleapis.com/v1beta/models/${mockModel}:generateContent?key=${mockGeminiApiKey}`,
      ),
      expect.any(Object),
    );
  });
});

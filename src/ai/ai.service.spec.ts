import { Test, TestingModule } from "@nestjs/testing";
import { AiService } from "./ai.service";
import { GeminiProvider } from "./providers/gemini.provider";
import { TasksRepository } from "../tasks/tasks.repository";
import { GenerateTasksDto } from "./dto/generate-tasks.dto";
import { Task } from "../tasks/entities/task.entity";
import { LoggerService } from "../common/logger/logger.service";
import { ConfigService } from "@nestjs/config";
import {
  HttpException,
  BadGatewayException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";

// Mock AiService dependencies
const mockGeminiProvider = {
  complete: jest.fn(),
};

const mockTasksRepository = {
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockLoggerService = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe("AiService", () => {
  let service: AiService;
  let module: TestingModule;

  const mockGeminiApiKey = "mock-gemini-api-key";
  const mockObjective = "Create a new task";
  const mockModel = "gemini-1.5-flash";
  const mockApiUrl = "https://generativelanguage.googleapis.com/v1beta/models";

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === "gemini.apiUrl") return mockApiUrl;
      if (key === "gemini.model") return mockModel;
      return undefined;
    });

    module = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: GeminiProvider, useValue: mockGeminiProvider },
        { provide: TasksRepository, useValue: mockTasksRepository },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  // Restore spies and real timers after every test to prevent leaking between tests
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateTasks", () => {
    const mockGenerateTasksDto: GenerateTasksDto = {
      objective: mockObjective,
      apiKey: mockGeminiApiKey,
    };
    const mockTask: Task = {
      id: "task-1",
      title: "Mock Task Title",
      isCompleted: false,
      isAiGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should successfully generate tasks", async () => {
      mockGeminiProvider.complete.mockResolvedValue({
        status: 200,
        text: JSON.stringify({
          tasks: [{ title: "Generated Task 1" }, { title: "Generated Task 2" }],
        }),
      });
      mockTasksRepository.create.mockResolvedValue(mockTask);
      mockTasksRepository.findOne.mockResolvedValue({
        ...mockTask,
        isAiGenerated: true,
      });
      mockTasksRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.generateTasks(mockGenerateTasksDto);

      expect(mockGeminiProvider.complete).toHaveBeenCalledWith(
        expect.stringContaining("Objetivo do usuário: Create a new task"),
        mockGeminiApiKey,
        mockModel,
        mockApiUrl,
      );
      expect(mockTasksRepository.create).toHaveBeenCalledTimes(2);
      expect(mockTasksRepository.update).toHaveBeenCalledTimes(2);
      expect(mockTasksRepository.findOne).toHaveBeenCalledTimes(2);
      expect(result.length).toBe(2);
      expect(result[0].isAiGenerated).toBe(true);
    });

    describe("handleLlmError", () => {
      const mockGenerateTasksDto: GenerateTasksDto = {
        objective: "Handle errors",
        apiKey: mockGeminiApiKey,
      };

      it("should throw UnauthorizedException on 401/403 status", async () => {
        mockGeminiProvider.complete.mockResolvedValue({
          status: 401,
          text: "",
        });
        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow(UnauthorizedException);
        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow("API Key inválida ou sem permissão.");
      });

      it("should call retryGenerateTask for 429 status and eventually succeed", async () => {
        jest.useFakeTimers();

        mockGeminiProvider.complete
          .mockResolvedValueOnce({ status: 429, text: "" })
          .mockResolvedValueOnce({
            status: 200,
            text: JSON.stringify({ tasks: [{ title: "Retried Task" }] }),
          });

        mockTasksRepository.create.mockResolvedValue(mockTask);
        mockTasksRepository.findOne.mockResolvedValue({
          ...mockTask,
          isAiGenerated: true,
        });
        mockTasksRepository.update.mockResolvedValue({ affected: 1 });

        const retrySpy = jest.spyOn(service as any, "retryGenerateTask");

        const promise = service.generateTasks(mockGenerateTasksDto);

        await jest.runAllTimersAsync();
        const result = await promise;

        expect(retrySpy).toHaveBeenCalledTimes(1);
        expect(mockGeminiProvider.complete).toHaveBeenCalledTimes(2);
        expect(result.length).toBe(1);
        expect(result[0].title).toBe("Mock Task Title");
      });

      it("should throw HttpException for 429 status if limit exceeded after 3 retries", async () => {
        jest.useFakeTimers();
        mockGeminiProvider.complete.mockResolvedValue({
          status: 429,
          text: "",
        });

        const promise = service.generateTasks(mockGenerateTasksDto);
        jest.runAllTimersAsync();

        await expect(promise).rejects.toThrow(HttpException);
        await expect(promise).rejects.toThrow(
          "Limite de requisições da API de IA atingido.",
        );
      });

      it("should throw BadGatewayException on 5xx status", async () => {
        mockGeminiProvider.complete.mockResolvedValue({
          status: 502,
          text: "",
        });
        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow(BadGatewayException);
        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow("O serviço de IA retornou um erro interno.");
      });

      it("should throw BadGatewayException for other LLM errors", async () => {
        mockGeminiProvider.complete.mockResolvedValue({
          status: 400,
          text: "",
        });
        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow(BadGatewayException);
        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow(
          "Erro de conexão com o serviço de IA ou resposta inesperada.",
        );
      });
    });

    describe("parseAndValidateResponse", () => {
      const mockGenerateTasksDto: GenerateTasksDto = {
        objective: "Parse errors",
        apiKey: mockGeminiApiKey,
      };

      it("should throw BadGatewayException on invalid JSON parsing when retries are exhausted", async () => {
        await expect(
          (service as any).parseAndValidateResponse(
            "invalid json",
            mockGenerateTasksDto,
            4,
          ),
        ).rejects.toThrow(BadGatewayException);
        await expect(
          (service as any).parseAndValidateResponse(
            "invalid json",
            mockGenerateTasksDto,
            4,
          ),
        ).rejects.toThrow("A IA retornou uma resposta em formato inesperado.");
      });

      it("should throw BadGatewayException if response is not a valid object when retries are exhausted", async () => {
        // "42" is valid JSON that deserialises to a number (not an object)
        await expect(
          (service as any).parseAndValidateResponse(
            "42",
            mockGenerateTasksDto,
            4,
          ),
        ).rejects.toThrow(BadGatewayException);
        await expect(
          (service as any).parseAndValidateResponse(
            "42",
            mockGenerateTasksDto,
            4,
          ),
        ).rejects.toThrow("A IA retornou uma resposta em formato inesperado.");
      });

      it("should throw BadGatewayException if 'tasks' field is missing", async () => {
        mockGeminiProvider.complete.mockResolvedValue({
          status: 200,
          text: JSON.stringify({ otherField: "value" }),
        });
        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow(BadGatewayException);
        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow("A resposta da IA não contém o formato esperado.");
        expect(
          jest.spyOn(service as any, "retryGenerateTask"),
        ).not.toHaveBeenCalled();
      });

      it("should throw BadGatewayException if 'tasks' field is not an array", async () => {
        mockGeminiProvider.complete.mockResolvedValue({
          status: 200,
          text: JSON.stringify({ tasks: "not an array" }),
        });
        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow(BadGatewayException);
        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow("A resposta da IA não contém o formato esperado.");
        expect(
          jest.spyOn(service as any, "retryGenerateTask"),
        ).not.toHaveBeenCalled();
      });

      it("should throw UnprocessableEntityException if AI generated an empty task list", async () => {
        mockGeminiProvider.complete.mockResolvedValue({
          status: 200,
          text: JSON.stringify({ tasks: [] }),
        });
        const retrySpy = jest.spyOn(service as any, "retryGenerateTask");

        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow(UnprocessableEntityException);
        await expect(
          service.generateTasks(mockGenerateTasksDto),
        ).rejects.toThrow(
          "A IA não conseguiu gerar tarefas para este objetivo.",
        );
        expect(retrySpy).not.toHaveBeenCalled();
      });
    });

    it("should retry task generation up to 3 times on transient errors and then succeed", async () => {
      jest.useFakeTimers();

      const mockGenerateTasksDto: GenerateTasksDto = {
        objective: "Retry logic test",
        apiKey: mockGeminiApiKey,
      };

      mockGeminiProvider.complete
        .mockResolvedValueOnce({ status: 429, text: "" })
        .mockResolvedValueOnce({ status: 429, text: "" })
        .mockResolvedValueOnce({ status: 429, text: "" })
        .mockResolvedValueOnce({
          status: 200,
          text: JSON.stringify({ tasks: [{ title: "Success Task" }] }),
        });

      mockTasksRepository.create.mockResolvedValue(mockTask);
      mockTasksRepository.findOne.mockResolvedValue({
        ...mockTask,
        isAiGenerated: true,
      });
      mockTasksRepository.update.mockResolvedValue({ affected: 1 });

      const promise = service.generateTasks(mockGenerateTasksDto);
      await jest.runAllTimersAsync();

      await expect(promise).resolves.toBeDefined();
      expect(mockGeminiProvider.complete).toHaveBeenCalledTimes(4);
    });

    it("should throw HttpException if rate limit is exceeded after 3 retries", async () => {
      jest.useFakeTimers();

      const mockGenerateTasksDto: GenerateTasksDto = {
        objective: "Exceed retry limit",
        apiKey: mockGeminiApiKey,
      };

      mockGeminiProvider.complete.mockResolvedValue({ status: 429, text: "" });

      const promise = service.generateTasks(mockGenerateTasksDto);
      jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow(HttpException);
      await expect(promise).rejects.toThrow(
        "Limite de requisições da API de IA atingido.",
      );
    });

    it("should set isAiGenerated to true for generated tasks", async () => {
      mockGeminiProvider.complete.mockResolvedValue({
        status: 200,
        text: JSON.stringify({
          tasks: [{ title: "Task to mark as AI generated" }],
        }),
      });
      const mockTaskWithId = {
        ...mockTask,
        id: "generated-task-1",
        isAiGenerated: false,
      };
      const mockAiGeneratedTask = { ...mockTaskWithId, isAiGenerated: true };

      mockTasksRepository.create.mockResolvedValue(mockTaskWithId);
      mockTasksRepository.update.mockResolvedValue({ affected: 1 });
      mockTasksRepository.findOne.mockResolvedValue(mockAiGeneratedTask);

      const result = await service.generateTasks(mockGenerateTasksDto);

      expect(result.length).toBe(1);
      expect(result[0].isAiGenerated).toBe(true);
    });

    it("should handle repository errors gracefully during task creation", async () => {
      mockGeminiProvider.complete.mockResolvedValue({
        status: 200,
        text: JSON.stringify({
          tasks: [{ title: "Task that fails creation" }],
        }),
      });
      mockTasksRepository.create.mockRejectedValue(
        new Error("DB error during create"),
      );

      await expect(service.generateTasks(mockGenerateTasksDto)).rejects.toThrow(
        "DB error during create",
      );

      expect(mockTasksRepository.update).not.toHaveBeenCalled();
      expect(mockTasksRepository.findOne).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully during task update", async () => {
      mockGeminiProvider.complete.mockResolvedValue({
        status: 200,
        text: JSON.stringify({ tasks: [{ title: "Task that fails update" }] }),
      });
      mockTasksRepository.create.mockResolvedValue(mockTask);
      mockTasksRepository.update.mockRejectedValue(
        new Error("DB error during update"),
      );

      await expect(service.generateTasks(mockGenerateTasksDto)).rejects.toThrow(
        "DB error during update",
      );
      expect(mockTasksRepository.findOne).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully during task findOne", async () => {
      mockGeminiProvider.complete.mockResolvedValue({
        status: 200,
        text: JSON.stringify({ tasks: [{ title: "Task that fails findOne" }] }),
      });
      mockTasksRepository.create.mockResolvedValue(mockTask);
      mockTasksRepository.update.mockResolvedValue({ affected: 1 });
      mockTasksRepository.findOne.mockRejectedValue(
        new Error("DB error during findOne"),
      );

      await expect(service.generateTasks(mockGenerateTasksDto)).rejects.toThrow(
        "DB error during findOne",
      );
    });
  });

  describe("buildPrompt", () => {
    // buildPrompt is a private method, tested indirectly via generateTasks.
  });
});

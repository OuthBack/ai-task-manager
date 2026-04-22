import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import {
  BadGatewayException,
  ServiceUnavailableException,
  UnauthorizedException,
  HttpException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { AiService } from "./ai.service";
import { GeminiProvider } from "./providers/gemini.provider";
import { TasksRepository } from "./../tasks/tasks.repository";
import { GenerateTasksDto } from "./dto/generate-tasks.dto";
import { LoggerService } from "./../common/logger/logger.service";

describe("AiService", () => {
  let service: AiService;
  let geminiProvider: GeminiProvider;
  let tasksRepository: TasksRepository;
  let configService: ConfigService;

  const mockTask = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Test task",
    isCompleted: false,
    isAiGenerated: true,
    createdAt: new Date("2026-04-16T21:08:34.000Z"),
    updatedAt: new Date("2026-04-16T21:08:34.000Z"),
  };

  const mockGeminiProvider = {
    complete: jest.fn(),
  };

  const mockTasksRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: GeminiProvider,
          useValue: mockGeminiProvider,
        },
        {
          provide: TasksRepository,
          useValue: mockTasksRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    geminiProvider = module.get<GeminiProvider>(GeminiProvider);
    tasksRepository = module.get<TasksRepository>(TasksRepository);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === "gemini.apiUrl") return "https://api.gemini.com";
      if (key === "gemini.model") return "gemini-1.5-flash";
      return null;
    });
  });

  describe("generateTasks", () => {
    const generateDto: GenerateTasksDto = {
      objective: "Build a mobile app",
      apiKey: "test-key",
    };

    const validGeminiResponse = {
      status: 200,
      text: JSON.stringify({
        tasks: [
          { title: "Define requirements" },
          { title: "Design UI mockups" },
          { title: "Set up development environment" },
        ],
      }),
    };

    it("should call GeminiProvider with structured prompt", async () => {
      mockGeminiProvider.complete.mockResolvedValue(validGeminiResponse);
      mockTasksRepository.create.mockResolvedValue(mockTask);
      mockTasksRepository.update.mockResolvedValue(undefined);
      mockTasksRepository.findOne.mockResolvedValue(mockTask);

      await service.generateTasks(generateDto);

      expect(mockGeminiProvider.complete).toHaveBeenCalledWith(
        expect.stringContaining("Build a mobile app"),
        "test-key",
        "gemini-1.5-flash",
        "https://api.gemini.com",
      );
    });

    it("should persist tasks with isAiGenerated=true", async () => {
      mockGeminiProvider.complete.mockResolvedValue(validGeminiResponse);
      mockTasksRepository.create.mockResolvedValue(mockTask);
      mockTasksRepository.update.mockResolvedValue(undefined);
      mockTasksRepository.findOne.mockResolvedValue(mockTask);

      await service.generateTasks(generateDto);

      expect(mockTasksRepository.create).toHaveBeenCalled();
      expect(mockTasksRepository.update).toHaveBeenCalled();
      expect(mockTasksRepository.findOne).toHaveBeenCalled();
    });

    it("should return array of created tasks", async () => {
      mockGeminiProvider.complete.mockResolvedValue(validGeminiResponse);
      mockTasksRepository.create.mockResolvedValue(mockTask);
      mockTasksRepository.update.mockResolvedValue(undefined);
      mockTasksRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.generateTasks(generateDto);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].isAiGenerated).toBe(true);
      expect(result.length).toBe(3);
    });
  });

  describe("Error Scenarios", () => {
    const generateDto: GenerateTasksDto = {
      objective: "Build a mobile app",
      apiKey: "test-key",
    };

    it("should throw BadGatewayException for invalid JSON after retries", async () => {
      jest.useFakeTimers();
      mockGeminiProvider.complete.mockResolvedValue({
        status: 200,
        text: "invalid json {]",
      });

      const promise = service.generateTasks(generateDto);

      jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow(HttpException);
      jest.useRealTimers();
    });

    it("should throw BadGatewayException when response missing tasks field", async () => {
      mockGeminiProvider.complete.mockResolvedValue({
        status: 200,
        text: JSON.stringify({ error: "no tasks" }),
      });

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        BadGatewayException,
      );
    });

    it("should throw UnprocessableEntityException for empty tasks array", async () => {
      mockGeminiProvider.complete.mockResolvedValue({
        status: 200,
        text: JSON.stringify({ tasks: [] }),
      });

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it("should throw UnauthorizedException for 401 response", async () => {
      mockGeminiProvider.complete.mockResolvedValue({
        status: 401,
        text: "Unauthorized",
      });

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for 403 response", async () => {
      mockGeminiProvider.complete.mockResolvedValue({
        status: 403,
        text: "Forbidden",
      });

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw BadGatewayException for 5xx response", async () => {
      mockGeminiProvider.complete.mockResolvedValue({
        status: 500,
        text: "Internal Server Error",
      });

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        BadGatewayException,
      );
    });
  });
});

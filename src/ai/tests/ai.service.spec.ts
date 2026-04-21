import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadGatewayException,
  ServiceUnavailableException,
  UnauthorizedException,
  HttpException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AiService } from '../ai.service';
import { GeminiProvider } from '../providers/gemini.provider';
import { TasksRepository } from '../../tasks/tasks.repository';
import { GenerateTasksDto } from '../dto/generate-tasks.dto';
import { LoggerService } from '../../common/logger/logger.service';


describe('AiService', () => {
  let service: AiService;
  let geminiProvider: GeminiProvider;
  let tasksRepository: TasksRepository;
  let configService: ConfigService;

  const mockTask = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test task',
    isCompleted: false,
    isAiGenerated: true,
    createdAt: new Date('2026-04-16T21:08:34.000Z'),
    updatedAt: new Date('2026-04-16T21:08:34.000Z'),
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
    mockConfigService.get.mockReturnValue('gemini-1.5-flash');
  });

  describe('generateTasks', () => {
    const generateDto: GenerateTasksDto = {
      objective: 'Build a mobile app',
      apiKey: 'test-key',
    };

    const validGeminiResponse = JSON.stringify({
      tasks: [
        { title: 'Define requirements' },
        { title: 'Design UI mockups' },
        { title: 'Set up development environment' },
      ],
    });

    it('should call GeminiProvider with structured prompt', async () => {
      mockGeminiProvider.complete.mockResolvedValue(validGeminiResponse);
      mockTasksRepository.create.mockResolvedValue(mockTask);
      mockTasksRepository.findOne.mockResolvedValue(mockTask);

      await service.generateTasks(generateDto);

      expect(mockGeminiProvider.complete).toHaveBeenCalled();
      const callArgs = mockGeminiProvider.complete.mock.calls[0];
      expect(callArgs[0]).toContain('Build a mobile app');
    });

    it('should persist tasks with isAiGenerated=true', async () => {
      mockGeminiProvider.complete.mockResolvedValue(validGeminiResponse);
      mockTasksRepository.create.mockResolvedValue(mockTask);
      mockTasksRepository.findOne.mockResolvedValue(mockTask);

      await service.generateTasks(generateDto);

      expect(mockTasksRepository.create).toHaveBeenCalled();
    });

    it('should return array of created tasks', async () => {
      mockGeminiProvider.complete.mockResolvedValue(validGeminiResponse);
      mockTasksRepository.create.mockResolvedValue(mockTask);
      mockTasksRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.generateTasks(generateDto);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Error Scenarios', () => {
    const generateDto: GenerateTasksDto = {
      objective: 'Build a mobile app',
      apiKey: 'test-key',
    };

    it('should throw BadGatewayException for invalid JSON', async () => {
      mockGeminiProvider.complete.mockResolvedValue('invalid json {]');

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('should throw BadGatewayException when response missing tasks field', async () => {
      mockGeminiProvider.complete.mockResolvedValue(
        JSON.stringify({ error: 'no tasks' }),
      );

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('should throw UnprocessableEntityException for empty tasks array', async () => {
      mockGeminiProvider.complete.mockResolvedValue(
        JSON.stringify({ tasks: [] }),
      );

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw ServiceUnavailableException on timeout', async () => {
      mockGeminiProvider.complete.mockRejectedValue(
        new ServiceUnavailableException(
          'O serviço de IA não respondeu a tempo. Tente novamente.',
        ),
      );

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw UnauthorizedException for 401 response', async () => {
      mockGeminiProvider.complete.mockRejectedValue(
        new UnauthorizedException('API Key inválida ou sem permissão.'),
      );

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for 403 response', async () => {
      mockGeminiProvider.complete.mockRejectedValue(
        new UnauthorizedException('API Key inválida ou sem permissão.'),
      );

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw exception for 429 response', async () => {
      mockGeminiProvider.complete.mockRejectedValue(
        new HttpException('Limite de requisições da API de IA atingido.', 429),
      );

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw BadGatewayException for 5xx response', async () => {
      mockGeminiProvider.complete.mockRejectedValue(
        new BadGatewayException(
          'A IA retornou uma resposta em formato inesperado.',
        ),
      );

      await expect(service.generateTasks(generateDto)).rejects.toThrow(
        BadGatewayException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GenerateTasksDto } from './dto/generate-tasks.dto';
import { TaskResponseDto } from '../tasks/dto/task-response.dto';
import { HttpStatus } from '@nestjs/common';

// Mock AiService
const mockAiService = {
  generateTasks: jest.fn(),
};

describe('AiController', () => {
  let controller: AiController;
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generate', () => {
    it('should call AiService.generateTasks with correct DTO and return its result', async () => {
      const mockGenerateTasksDto: GenerateTasksDto = {
        objective: 'Build a mobile app',
        apiKey: 'fake-api-key',
      };
      const mockGeneratedTasks: TaskResponseDto[] = [
        {
          id: '1',
          title: 'Define requirements',
          isCompleted: false,
          isAiGenerated: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Design UI/UX',
          isCompleted: false,
          isAiGenerated: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the service method to return a successful result
      (service.generateTasks as jest.Mock).mockResolvedValue(mockGeneratedTasks);

      // Call the controller method
      const result = await controller.generate(mockGenerateTasksDto);

      // Assert that the service method was called with the correct DTO
      expect(service.generateTasks).toHaveBeenCalledWith(mockGenerateTasksDto);
      // Assert that the controller returned the result from the service
      expect(result).toEqual(mockGeneratedTasks);

      // Also check if the HttpCode decorator is correctly applied (though Jest doesn't directly test decorators, we ensure the method itself is called)
      // The HttpCode decorator is tested implicitly by NestJS framework in integration tests.
      // For unit tests, we focus on the logic flow.
      // The actual HTTP status is handled by NestJS when the controller method returns.
      // We can verify that the method is expected to return CREATED status based on the decorator.
      // This is more of a conceptual check in unit tests.
      // If we were to assert the status code, it would be in an integration test.
    });

    // Test cases for error handling (e.g., invalid DTO, service errors) would typically be integration tests
    // or would involve testing the exception filter which is outside the scope of controller unit tests alone.
    // For unit tests, we assume the service will throw errors and the framework handles them.
  });
});

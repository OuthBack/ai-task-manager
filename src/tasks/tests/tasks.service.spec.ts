import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from '../tasks.service';
import { TasksRepository } from '../tasks.repository';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { LoggerService } from '../../common/logger/logger.service';

describe('TasksService', () => {
  let service: TasksService;
  let repository: TasksRepository;

  const mockTask = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test task',
    isCompleted: false,
    isAiGenerated: false,
    createdAt: new Date('2026-04-16T21:08:34.000Z'),
    updatedAt: new Date('2026-04-16T21:08:34.000Z'),
  };

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TasksRepository,
          useValue: mockRepository,
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

    service = module.get<TasksService>(TasksService);
    repository = module.get<TasksRepository>(TasksRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should return the created task with isCompleted=false', async () => {
      const createDto: CreateTaskDto = { title: 'Test task' };
      mockRepository.create.mockResolvedValue(mockTask);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTask);
      expect(result.isCompleted).toBe(false);
    });

    it('should call repository.save with correct data', async () => {
      const createDto: CreateTaskDto = { title: 'Test task' };
      mockRepository.create.mockResolvedValue(mockTask);

      await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const tasks = [mockTask];
      mockRepository.findAll.mockResolvedValue(tasks);

      const result = await service.findAll();

      expect(result).toEqual(tasks);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update isCompleted to true', async () => {
      const updateDto: UpdateTaskDto = { isCompleted: true };
      const updatedTask = { ...mockTask, isCompleted: true };

      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.update.mockResolvedValue(updatedTask);

      const result = await service.update(mockTask.id, updateDto);

      expect(result.isCompleted).toBe(true);
    });

    it('should throw NotFoundException for non-existent task', async () => {
      const updateDto: UpdateTaskDto = { title: 'Updated' };
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should call repository.delete with correct ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.delete.mockResolvedValue(true);

      await service.remove(mockTask.id);

      expect(mockRepository.delete).toHaveBeenCalledWith(mockTask.id);
    });

    it('should throw NotFoundException for non-existent task', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

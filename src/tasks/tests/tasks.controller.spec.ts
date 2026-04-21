import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TasksController } from '../tasks.controller';
import { TasksService } from '../tasks.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTask = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test task',
    isCompleted: false,
    isAiGenerated: false,
    createdAt: new Date('2026-04-16T21:08:34.000Z'),
    updatedAt: new Date('2026-04-16T21:08:34.000Z'),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);

    jest.clearAllMocks();
  });

  describe('POST /tasks', () => {
    it('should create and return a task', async () => {
      const createDto: CreateTaskDto = { title: 'Test task' };
      mockService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockTask);
      expect(mockService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('GET /tasks', () => {
    it('should return an array of tasks', async () => {
      const tasks = [mockTask];
      mockService.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll();

      expect(result).toEqual(tasks);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return a single task', async () => {
      mockService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne(mockTask.id);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update and return the task', async () => {
      const updateDto: UpdateTaskDto = { isCompleted: true };
      const updatedTask = { ...mockTask, isCompleted: true };
      mockService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(mockTask.id, updateDto);

      expect(result).toEqual(updatedTask);
      expect(mockService.update).toHaveBeenCalledWith(mockTask.id, updateDto);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should call service.remove', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(mockTask.id);

      expect(mockService.remove).toHaveBeenCalledWith(mockTask.id);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockService.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

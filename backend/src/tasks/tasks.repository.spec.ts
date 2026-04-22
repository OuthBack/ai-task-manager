import { Test, TestingModule } from '@nestjs/testing';
import { TasksRepository } from '../tasks/tasks.repository';
import { Task } from '../tasks/entities/task.entity';
import { Repository } from 'typeorm'; // Removed getRepositoryToken from here
import { getRepositoryToken } from '@nestjs/typeorm'; // Import getRepositoryToken from @nestjs/typeorm
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { UpdateTaskDto } from '../tasks/dto/update-task.dto';

// Mock the TypeORM Repository
const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('TasksRepository', () => {
  let repository: TasksRepository;
  let mockModule: TestingModule;

  beforeEach(async () => {
    // Clear mocks before each test
    jest.clearAllMocks();

    mockModule = await Test.createTestingModule({
      providers: [
        TasksRepository,
        {
          // Use getRepositoryToken(Task) for mocking specific entity repositories
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
        // Task, // No longer needed when using getRepositoryToken
      ],
    }).compile();

    repository = mockModule.get<TasksRepository>(TasksRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new task', async () => {
      const createTaskDto: CreateTaskDto = { title: 'New Task' };
      const mockTask: Task = {
        id: '1',
        title: 'New Task',
        isCompleted: false,
        isAiGenerated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository methods
      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await repository.create(createTaskDto);

      // Assertions
      expect(mockRepository.create).toHaveBeenCalledWith(createTaskDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockTask);
      expect(result).toEqual(mockTask);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          isCompleted: false,
          isAiGenerated: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          id: '2',
          title: 'Task 2',
          isCompleted: true,
          isAiGenerated: false,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
        },
      ];

      // Mock repository.find to return tasks in DESC order by createdAt
      mockRepository.find.mockResolvedValue(mockTasks);

      const result = await repository.findAll();

      // Assertions
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockTasks);
    });

    it('should return an empty array if no tasks are found', async () => {
      // Mock repository.find to return an empty array
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      // Assertions
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a task if found', async () => {
      const taskId = '1';
      const mockTask: Task = {
        id: taskId,
        title: 'Specific Task',
        isCompleted: false,
        isAiGenerated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository.findOne to return a task
      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await repository.findOne(taskId);

      // Assertions
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: taskId } });
      expect(result).toEqual(mockTask);
    });

    it('should return null if task is not found', async () => {
      const taskId = 'non-existent-id';

      // Mock repository.findOne to return null
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne(taskId);

      // Assertions
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: taskId } });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a task and return the updated task', async () => {
      const taskId = '1';
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Task Title', isCompleted: true };
      const mockUpdatedTask: Task = {
        id: taskId,
        title: 'Updated Task Title',
        isCompleted: true,
        isAiGenerated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock repository.update to return an update result object
      mockRepository.update.mockResolvedValue({ affected: 1 });
      // Mock findOne to return the updated task after update
      mockRepository.findOne.mockResolvedValue(mockUpdatedTask);

      const result = await repository.update(taskId, updateTaskDto);

      // Assertions
      expect(mockRepository.update).toHaveBeenCalledWith(taskId, updateTaskDto);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: taskId } }); // Called after update
      expect(result).toEqual(mockUpdatedTask);
    });

    it('should return null if task to update is not found', async () => {
      const taskId = 'non-existent-id';
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Task Title' };

      // Mock repository.update to indicate no affected rows
      mockRepository.update.mockResolvedValue({ affected: 0 });
      // Mock findOne to return null, as the task wouldn't be found after an attempted update
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.update(taskId, updateTaskDto);

      // Assertions
      expect(mockRepository.update).toHaveBeenCalledWith(taskId, updateTaskDto);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: taskId } }); // Still called to fetch after update
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a task and return true if successful', async () => {
      const taskId = '1';

      // Mock repository.delete to indicate successful deletion
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await repository.delete(taskId);

      // Assertions
      expect(mockRepository.delete).toHaveBeenCalledWith(taskId);
      expect(result).toBe(true);
    });

    it('should return false if task to delete is not found', async () => {
      const taskId = 'non-existent-id';

      // Mock repository.delete to indicate no rows affected
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await repository.delete(taskId);

      // Assertions
      expect(mockRepository.delete).toHaveBeenCalledWith(taskId);
      expect(result).toBe(false);
    });
  });
});

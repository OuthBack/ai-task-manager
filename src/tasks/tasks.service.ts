import { Injectable, NotFoundException } from "@nestjs/common";
import { TasksRepository } from "./tasks.repository";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { Task } from "./entities/task.entity";
import { LoggerService } from "src/common/logger/logger.service";

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    this.logger.log(
      `Attempting to create a new task with title: "${createTaskDto.title}"`,
    );
    const task = await this.tasksRepository.create(createTaskDto);
    this.logger.log(`Task created successfully with ID: "${task.id}"`);
    return task;
  }

  async findAll(): Promise<Task[]> {
    this.logger.log("Retrieving all tasks.");
    const tasks = await this.tasksRepository.findAll();
    this.logger.log(`Retrieved ${tasks.length} tasks.`);
    return tasks;
  }

  async findOne(id: string): Promise<Task> {
    this.logger.log(`Attempting to find task with ID: "${id}"`);
    const task = await this.tasksRepository.findOne(id);
    if (!task) {
      this.logger.warn(`Task with ID: "${id}" not found.`);
      throw new NotFoundException("Task not found");
    }
    this.logger.log(`Task with ID: "${id}" found.`);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    this.logger.log(
      `Attempting to update task with ID: "${id}" with data: ${JSON.stringify(updateTaskDto)}`,
    );
    await this.findOne(id); // Verify task exists
    const updatedTask = await this.tasksRepository.update(id, updateTaskDto);
    if (!updatedTask) {
      this.logger.warn(
        `Task with ID: "${id}" not found during update operation.`,
      );
      throw new NotFoundException("Task not found");
    }
    this.logger.log(`Task with ID: "${id}" updated successfully.`);
    return updatedTask;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Attempting to remove task with ID: "${id}"`);
    await this.findOne(id); // Verify task exists
    const deleted = await this.tasksRepository.delete(id);
    if (!deleted) {
      this.logger.warn(
        `Task with ID: "${id}" not found during remove operation.`,
      );
      throw new NotFoundException("Task not found");
    }
    this.logger.log(`Task with ID: "${id}" removed successfully.`);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksRepository.create(createTaskDto);
  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.findAll();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    await this.findOne(id); // Verify task exists
    const updatedTask = await this.tasksRepository.update(id, updateTaskDto);
    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }
    return updatedTask;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify task exists
    const deleted = await this.tasksRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Task not found');
    }
  }
}

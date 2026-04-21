import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.repository.create(createTaskDto);
    return this.repository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task | null> {
    await this.repository.update(id, updateTaskDto);
    return this.findOne(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}

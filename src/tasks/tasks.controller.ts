import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid task data',
  })
  async create(@Body() createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({
    status: 200,
    description: 'List of all tasks',
    type: [TaskResponseDto],
  })
  async findAll(): Promise<TaskResponseDto[]> {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Task found',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  async findOne(@Param('id') id: string): Promise<TaskResponseDto> {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', description: 'Task ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Task updated successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid task data',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID (UUID)' })
  @ApiResponse({
    status: 204,
    description: 'Task deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.tasksService.remove(id);
  }
}

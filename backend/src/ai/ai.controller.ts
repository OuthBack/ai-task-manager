import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateTasksDto } from './dto/generate-tasks.dto';
import { TaskResponseDto } from '../tasks/dto/task-response.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate tasks from a natural language objective',
    description:
      'Uses Gemini AI to generate a list of actionable tasks from a user-provided objective',
  })
  @ApiResponse({
    status: 201,
    description: 'Tasks generated and persisted successfully',
    type: [TaskResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid objective/apiKey',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired API key',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded on Gemini API',
  })
  @ApiResponse({
    status: 502,
    description: 'Gemini returned invalid response format',
  })
  @ApiResponse({
    status: 503,
    description: 'Gemini service timeout (>30s)',
  })
  @ApiResponse({
    status: 422,
    description: 'Gemini could not generate tasks for this objective',
  })
  async generate(
    @Body() generateTasksDto: GenerateTasksDto,
  ): Promise<TaskResponseDto[]> {
    return this.aiService.generateTasks(generateTasksDto);
  }
}

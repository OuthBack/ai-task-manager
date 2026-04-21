import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateTasksDto {
  @ApiProperty({
    description: 'Natural language objective for task generation',
    example: 'Build a mobile app for task management',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Objective must not be empty' })
  objective: string;

  @ApiProperty({
    description: 'Google Gemini API key for authentication',
    example: 'AIzaSyD...',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}

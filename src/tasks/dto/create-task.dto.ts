import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Design database schema',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(500, { message: 'Title must not exceed 500 characters' })
  title: string;
}

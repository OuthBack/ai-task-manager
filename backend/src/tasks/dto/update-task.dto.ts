import { IsString, MinLength, MaxLength, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto {
  @ApiProperty({
    description: 'Updated task title',
    example: 'Updated task title',
    required: false,
    minLength: 1,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(500, { message: 'Title must not exceed 500 characters' })
  title?: string;

  @ApiProperty({
    description: 'Task completion status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

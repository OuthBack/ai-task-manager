import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  controllers: [AiController],
  providers: [AiService, GeminiProvider],
})
export class AiModule {}

import {
  Injectable,
  BadGatewayException,
  ServiceUnavailableException,
  UnauthorizedException,
  HttpException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { GeminiProvider } from "./providers/gemini.provider";
import { TasksRepository } from "../tasks/tasks.repository";
import { GenerateTasksDto } from "./dto/generate-tasks.dto";
import { Task } from "../tasks/entities/task.entity";
import { AiResponseDto } from "./dto/ai-response.dto";
import { LoggerService } from "../common/logger/logger.service";

@Injectable()
export class AiService {
  THROTTLE = 2 * 1000; // 2 seconds

  constructor(
    private readonly llmProvider: GeminiProvider,
    private readonly tasksRepository: TasksRepository,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async generateTasks(
    generateTasksDto: GenerateTasksDto,
    retries = 0,
  ): Promise<Task[]> {
    const { objective, apiKey } = generateTasksDto;

    if (retries > 3) {
      this.logger.warn(`AI rate limit exceeded.`, AiService.name);
      throw new HttpException(
        "Limite de requisições da API de IA atingido.",
        429,
      );
    }

    this.logger.log(
      `Initiating AI task generation for objective: "${objective}" - RETRIES: ${retries}`,
    );

    const prompt = this.buildPrompt(objective);

    const geminiApiUrl = this.configService.get<string>("gemini.apiUrl");
    const geminiModel = this.configService.get<string>("gemini.model");

    const response = await this.llmProvider.complete(
      prompt,
      apiKey,
      geminiModel,
      geminiApiUrl,
    );

    if (response.status !== 200) {
      return this.handleLlmError(response.status, generateTasksDto, retries);
    }

    const parsedResponse = await this.parseAndValidateResponse(
      response.text,
      generateTasksDto,
      retries,
    );

    const createdTasks: Task[] = [];
    for (const taskData of parsedResponse.tasks) {
      const task = await this.tasksRepository.create({
        title: taskData.title,
      });

      await this.tasksRepository.update(task.id, {});
      const updatedTask = await this.tasksRepository.findOne(task.id);
      if (updatedTask) {
        updatedTask.isAiGenerated = true;
        createdTasks.push(updatedTask);
      }
    }

    this.logger.log(
      `Successfully generated ${createdTasks.length} tasks for objective: "${objective}"`,
    );
    return createdTasks;
  }

  private buildPrompt(objective: string): string {
    return `Você é um assistente de produtividade. Sua única função é receber um objetivo e retornar uma lista de tarefas acionáveis.

REGRAS ESTRITAS:
- Retorne APENAS um objeto JSON válido, sem texto antes ou depois.
- O JSON deve seguir EXATAMENTE este formato: {"tasks": [{"title": "string"}, ...]}
- Gere entre 3 e 8 tarefas práticas e específicas.
- Cada título deve ser uma ação clara, começando com verbo no infinitivo.
- NÃO inclua explicações, markdown, blocos de código ou qualquer outro texto.

Objetivo do usuário: ${objective}`;
  }

  private async parseAndValidateResponse(
    response: string,
    generateTasksDto: GenerateTasksDto,
    retries: number,
  ): Promise<AiResponseDto> {
    let parsed: unknown;

    try {
      parsed = JSON.parse(response);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to parse AI response JSON: ${response.substring(0, 200)}...`,
          error.stack,
          AiService.name,
        );
      } else {
        this.logger.error(
          `Failed to parse AI response JSON: ${response.substring(0, 200)}...`,
          undefined,
          AiService.name,
        );
      }

      if (retries > 3) {
        throw new BadGatewayException(
          "A IA retornou uma resposta em formato inesperado.",
        );
      }

      parsed = await this.retryGenerateTask(generateTasksDto, retries);
    }

    if (!parsed || typeof parsed !== "object") {
      this.logger.error(
        `AI response is not a valid object: ${response.substring(0, 200)}...`,
        "",
        AiService.name,
      );

      if (retries > 3) {
        throw new BadGatewayException(
          "A IA retornou uma resposta em formato inesperado.",
        );
      }

      parsed = await this.retryGenerateTask(generateTasksDto, retries);
    }

    const data = parsed as Record<string, unknown>;

    if (!("tasks" in data)) {
      this.logger.error(
        `AI response missing 'tasks' field: ${response.substring(0, 200)}...`,
        "",
        AiService.name,
      );

      throw new BadGatewayException(
        "A resposta da IA não contém o formato esperado.",
      );
    }

    const tasks = data.tasks;
    if (!Array.isArray(tasks)) {
      this.logger.error(
        `AI response 'tasks' field is not an array: ${response.substring(0, 200)}...`,
        "",
        AiService.name,
      );
      throw new BadGatewayException(
        "A resposta da IA não contém o formato esperado.",
      );
    }

    if (tasks.length === 0) {
      this.logger.warn(
        `AI generated an empty task list for objective.`,
        AiService.name,
      );
      throw new UnprocessableEntityException(
        "A IA não conseguiu gerar tarefas para este objetivo.",
      );
    }

    return { tasks: tasks as Array<{ title: string }> };
  }

  private handleLlmError(
    status: number,
    generateTasksDto: GenerateTasksDto,
    retries: number,
  ): Promise<Task[]> {
    if (status === 401 || status === 403) {
      this.logger.warn(
        `AI unauthorized for request. Status: ${status}`,
        AiService.name,
      );
      throw new UnauthorizedException("API Key inválida ou sem permissão.");
    }

    if (status === 429) {
      return this.retryGenerateTask(generateTasksDto, retries);
    }

    if (status >= 500) {
      this.logger.error(
        `AI returned internal server error. Status: ${status}`,
        "",
        AiService.name,
      );
      throw new BadGatewayException(
        "O serviço de IA retornou um erro interno.",
      );
    }

    this.logger.error(`Generic LLM error: ${status}`, AiService.name);

    throw new BadGatewayException(
      "Erro de conexão com o serviço de IA ou resposta inesperada.",
    );
  }

  private retryGenerateTask(
    generateTasksDto: GenerateTasksDto,
    retries: number,
  ): Promise<Task[]> {
    return new Promise((resolve) =>
      setTimeout(
        () => {
          resolve(this.generateTasks(generateTasksDto, retries + 1));
        },
        this.THROTTLE ** (retries + 1),
      ),
    );
  }
}

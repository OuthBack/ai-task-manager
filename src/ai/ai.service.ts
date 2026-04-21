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
import { LoggerService } from "src/common/logger/logger.service";

@Injectable()
export class AiService {
  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly tasksRepository: TasksRepository,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {

  }

  async generateTasks(generateTasksDto: GenerateTasksDto): Promise<Task[]> {
    const { objective, apiKey } = generateTasksDto;

    this.logger.log(`Initiating AI task generation for objective: "${objective}"`);

    const prompt = this.buildPrompt(objective);

    let response: string;
    try {
      const geminiApiUrl = this.configService.get<string>("gemini.apiUrl");
      const geminiModel = this.configService.get<string>("gemini.model");

      response = await this.geminiProvider.complete(
        prompt,
        apiKey,
        geminiModel,
        geminiApiUrl,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error communicating with Gemini API for objective "${objective}": ${error.message}`, error.stack, AiService.name);
      } else {
        this.logger.error(`Error communicating with Gemini API for objective "${objective}": ${String(error)}`, undefined, AiService.name);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      this.handleLlmError(error);
    }

    const parsedResponse = this.parseAndValidateResponse(response);

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

    this.logger.log(`Successfully generated ${createdTasks.length} tasks for objective: "${objective}"`);
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

  private parseAndValidateResponse(response: string): AiResponseDto {
    let parsed: unknown;

    try {
      parsed = JSON.parse(response);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to parse AI response JSON: ${response.substring(0, 200)}...`, error.stack, AiService.name);
      } else {
        this.logger.error(`Failed to parse AI response JSON: ${response.substring(0, 200)}...`, undefined, AiService.name);
      }
      throw new BadGatewayException(
        "A IA retornou uma resposta em formato inesperado.",
      );
    }

    if (!parsed || typeof parsed !== "object") {
      this.logger.error(`AI response is not a valid object: ${response.substring(0, 200)}...`, '', AiService.name);
      throw new BadGatewayException(
        "A IA retornou uma resposta em formato inesperado.",
      );
    }

    const data = parsed as Record<string, unknown>;

    if (!("tasks" in data)) {
      this.logger.error(`AI response missing 'tasks' field: ${response.substring(0, 200)}...`, '', AiService.name);
      throw new BadGatewayException(
        "A resposta da IA não contém o formato esperado.",
      );
    }

    const tasks = data.tasks;
    if (!Array.isArray(tasks)) {
      this.logger.error(`AI response 'tasks' field is not an array: ${response.substring(0, 200)}...`, '', AiService.name);
      throw new BadGatewayException(
        "A resposta da IA não contém o formato esperado.",
      );
    }

    if (tasks.length === 0) {
      this.logger.warn(`AI generated an empty task list for objective.`, AiService.name);
      throw new UnprocessableEntityException(
        "A IA não conseguiu gerar tarefas para este objetivo.",
      );
    }

    return { tasks: tasks as Array<{ title: string }> };
  }

  private handleLlmError(error: unknown): never {
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage.includes("Gemini API responded with status")) {
        const statusMatch = errorMessage.match(/status (\d{3})/);
        const status = statusMatch ? parseInt(statusMatch[1], 10) : 500;

        if (status === 401 || status === 403) {
          this.logger.warn(`Gemini API unauthorized for request. Status: ${status}`, AiService.name);
          throw new UnauthorizedException("API Key inválida ou sem permissão.");
        }

        if (status === 429) {
          this.logger.warn(`Gemini API rate limit exceeded. Status: ${status}`, AiService.name);
          throw new HttpException(
            "Limite de requisições da API de IA atingido.",
            429,
          );
        }

        if (status >= 500) {
          this.logger.error(`Gemini API returned internal server error. Status: ${status}, Message: ${errorMessage}`, '', AiService.name);
          throw new BadGatewayException(
            "O serviço de IA retornou um erro interno.",
          );
        }
      }

      if (errorMessage.includes("Gemini API request timed out")) {
        this.logger.error(`Gemini API request timed out.`, '', AiService.name);
        throw new ServiceUnavailableException(
          "O serviço de IA não respondeu a tempo. Tente novamente.",
        );
      }

      if (
        errorMessage.includes("Invalid response structure from Gemini API")
      ) {
        this.logger.error(`Gemini API returned invalid response structure.`, '', AiService.name);
        throw new BadGatewayException(
          "A IA retornou uma resposta em formato inesperado.",
        );
      }

      this.logger.error(`Generic LLM error: ${errorMessage}`, error.stack, AiService.name);
      // Generic network error or other unexpected fetch errors
      throw new BadGatewayException(
        "Erro de conexão com o serviço de IA ou resposta inesperada.",
      );
    }

    this.logger.error(`Unknown LLM error: ${JSON.stringify(error)}`, '', AiService.name);
    // Fallback for any other unknown error
    throw new BadGatewayException(
      "Ocorreu um erro inesperado ao se comunicar com o serviço de IA.",
    );
  }
}

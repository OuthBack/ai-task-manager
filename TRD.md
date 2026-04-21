# TRD.md — Technical Requirements Document

## AI Task Manager Backend

**Version:** 1.0  
**Last Updated:** 2026-04-16  
**Status:** Phase 3 & 4 Complete (Full Implementation)

---

## 📋 Table of Contents

1. [Service Overview](#service-overview)
2. [Architecture & Trade-offs](#architecture--trade-offs)
3. [Module Responsibilities](#module-responsibilities)
   - [Logger Module](#logger-module)
4. [Data Model](#data-model)
5. [API Contract](#api-contract)
6. [Environment Variables](#environment-variables)
7. [Core Workflows](#core-workflows)
8. [Error Handling Strategy](#error-handling-strategy)
9. [Testing Strategy](#testing-strategy)
10. [Changelog](#changelog)

---

## Service Overview

**AI Task Manager** is a NestJS/TypeScript backend that provides a REST API for:

1. **Manual Task Management** — Create, read, update, and delete tasks
2. **AI-Powered Generation** — Generate tasks automatically from natural language objectives using Google's Gemini AI

### Key Objectives

- ✅ Type-safe, maintainable codebase (strict TypeScript, no `any`)
- ✅ Clean Architecture with strict layer separation
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Full API documentation via Swagger
- ✅ Testable design with unit tests for all business logic
- ✅ Security: API keys are **never logged or stored**

### Technology Stack

| Layer         | Technology      |
| ------------- | --------------- |
| Runtime       | Node.js 20+     |
| Framework     | NestJS 10.x     |
| Language      | TypeScript 5.x  |
| ORM           | TypeORM 0.3.x   |
| Database      | SQLite 3        |
| Validation    | class-validator |
| Documentation | Swagger 7.x     |
| Testing       | Jest 29.x       |
| HTTP Client   | Axios 1.x       |

---

## Architecture & Trade-offs

### 1. Clean Architecture Layers

```
HTTP Request
    ↓
┌─────────────────────────────────────┐
│ Controller (HTTP Handler)           │  ← Receives requests, validates DTOs, returns responses
└────────────────┬────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ Service (Business Logic)            │  ← Orchestrates use cases, enforces rules
└────────────────┬────────────────────┘
                 ↓
    ┌────────────────────┬────────────────────┐
    ↓                    ↓                    ↓
┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐
│ Repository      │ │ Provider         │ │ External API │
│ (Data Access)   │ │ (LLM Service)    │ │ (Gemini)     │
└─────────────────┘ └──────────────────┘ └──────────────┘
```

**Responsibilities:**

- **Controller** — HTTP concerns only (validation via DTOs, response formatting)
- **Service** — Business logic, error handling, use case orchestration
- **Repository** — Database queries, abstraction via TypeORM
- **Provider** — External service communication (LLM API)

**Constraints (enforced):**

- ❌ Controllers never access database directly
- ❌ Services never handle HTTP concerns (`Request`, `Response`)
- ❌ Providers never contain business logic
- ❌ Database queries only through Repository

### 2. SQLite + TypeORM

**Why SQLite?**

- ✅ File-based, zero-setup (perfect for MVP)
- ✅ Full SQL support, great query performance
- ✅ Easy to migrate to PostgreSQL later (same TypeORM syntax)
- ✅ Self-contained (database + code in one deployment)

**TypeORM Benefits:**

- Type-safe entity definitions
- Automatic migrations
- Relationship management
- Repository pattern (clean abstraction)

### 3. Global ValidationPipe + Pipes Pattern

All DTOs use `class-validator` decorators. A single global `ValidationPipe` in `main.ts` validates all requests automatically.

```typescript
@IsString()
@MinLength(1)
@MaxLength(500)
title: string;
```

→ NestJS validates every `POST /tasks` automatically before the controller runs.

### 4. Global ExceptionFilter

All exceptions (thrown or unhandled) pass through `HttpExceptionFilter`, ensuring consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed: title must be a string",
  "error": "Bad Request",
  "timestamp": "2026-04-16T21:08:34.769Z",
  "path": "/tasks"
}
```

### 5. Gemini API Integration

**Rationale:**

- Handles prompt engineering and response validation in `AiService`
- `GeminiProvider` is a thin wrapper over HTTP client (Axios)
- Decouples LLM provider from business logic
- **Never logs or stores API keys**

---

## Module Responsibilities

### `tasks` Module

Manages the entire lifecycle of tasks (CRUD operations).

**Files:**

- `task.entity.ts` — TypeORM entity (database schema)
- `tasks.repository.ts` — Data access layer (CRUD queries)
- `tasks.service.ts` — Business logic (create, update, delete, find, etc.)
- `tasks.controller.ts` — HTTP endpoints (GET, POST, PATCH, DELETE)
- `dto/*.ts` — Request/response contracts
- `tests/` — Unit tests for service and controller

**Responsibilities:**

- Persist tasks to SQLite
- Handle task updates and deletions
- Validate task data
- Return proper error codes for invalid operations

---

### `ai` Module

Generates tasks from natural language objectives using Gemini AI.

**Files:**

- `ai.service.ts` — Prompt engineering, response validation, task persistence
- `ai.controller.ts` — POST `/ai/generate` endpoint
- `providers/gemini.provider.ts` — HTTP client for Gemini API
- `dto/generate-tasks.dto.ts` — Request/response contracts
- `tests/ai.service.spec.ts` — Unit tests covering all error scenarios

**Responsibilities:**

- Construct structured prompts for the LLM
- Call Gemini API with proper authentication
- Validate and parse AI responses
- Map all error scenarios (timeout, invalid JSON, missing fields, etc.)
- Persist generated tasks with `isAiGenerated: true`

---

### `common` Module

Infrastructure and cross-cutting concerns.

**Files:**

- `filters/http-exception.filter.ts` — Global exception handler
- `interceptors/logging.interceptor.ts` — Request/response logging
- `pipes/validation.pipe.ts` — Global input validation

---

### `logger` Module

Provides a centralized and injectable logging service for the application.

**Files:**

- `logger.service.ts` — Custom logger extending NestJS Logger
- `logger.module.ts` — NestJS module for LoggerService

**Responsibilities:**

- Provide a consistent logging interface.
- Log significant application events, including:
    - Gemini API requests and responses (excluding API keys).
    - User interactions with task management (create, read, update, delete).
    - AI task generation requests and outcomes.

---

## Data Model

### Entity: `Task`

```typescript
@Entity("tasks")
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 500 })
  title: string;

  @Column({ type: "boolean", default: false })
  isCompleted: boolean;

  @Column({ type: "boolean", default: false })
  isAiGenerated: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Fields:**

| Field           | Type         | Constraints        | Purpose                        |
| --------------- | ------------ | ------------------ | ------------------------------ |
| `id`            | UUID         | PK, auto-generated | Unique identifier              |
| `title`         | VARCHAR(500) | NOT NULL           | Task description (1-500 chars) |
| `isCompleted`   | BOOLEAN      | DEFAULT false      | Completion status              |
| `isAiGenerated` | BOOLEAN      | DEFAULT false      | Marks tasks created by AI      |
| `createdAt`     | TIMESTAMP    | Auto               | Creation timestamp             |
| `updatedAt`     | TIMESTAMP    | Auto               | Last modification timestamp    |

---

## API Contract

### Base URL

```
http://localhost:3000
```

### Authentication

No authentication required for MVP (all endpoints are public).

### Tasks Endpoints

#### GET `/tasks`

List all tasks.

**Request:**

```
GET /tasks
```

**Response (200):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Design database schema",
    "isCompleted": false,
    "isAiGenerated": false,
    "createdAt": "2026-04-16T21:08:34.000Z",
    "updatedAt": "2026-04-16T21:08:34.000Z"
  }
]
```

---

#### POST `/tasks`

Create a new task manually.

**Request:**

```json
{
  "title": "Implement login endpoint"
}
```

**Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Implement login endpoint",
  "isCompleted": false,
  "isAiGenerated": false,
  "createdAt": "2026-04-16T21:08:34.000Z",
  "updatedAt": "2026-04-16T21:08:34.000Z"
}
```

**Validation Errors (400):**

```json
{
  "statusCode": 400,
  "message": "title must be a string",
  "error": "Bad Request",
  "timestamp": "2026-04-16T21:08:34.769Z",
  "path": "/tasks"
}
```

---

#### PATCH `/tasks/:id`

Update an existing task.

**Request:**

```json
{
  "title": "Updated task title",
  "isCompleted": true
}
```

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated task title",
  "isCompleted": true,
  "isAiGenerated": false,
  "createdAt": "2026-04-16T21:08:34.000Z",
  "updatedAt": "2026-04-16T21:08:35.000Z"
}
```

**Not Found (404):**

```json
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found",
  "timestamp": "2026-04-16T21:08:34.769Z",
  "path": "/tasks/invalid-id"
}
```

---

#### DELETE `/tasks/:id`

Delete a task.

**Request:**

```
DELETE /tasks/550e8400-e29b-41d4-a716-446655440000
```

**Response (204):** No content

**Not Found (404):**

```json
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found",
  "timestamp": "2026-04-16T21:08:34.769Z",
  "path": "/tasks/invalid-id"
}
```

---

### AI Endpoints

#### POST `/ai/generate`

Generate tasks from a natural language objective.

**Request:**

```json
{
  "objective": "Build a mobile app for task management",
  "apiKey": "gemini-api-key"
}
```

**Response (201):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Define app requirements and features",
    "isCompleted": false,
    "isAiGenerated": true,
    "createdAt": "2026-04-16T21:08:34.000Z",
    "updatedAt": "2026-04-16T21:08:34.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Design UI/UX mockups",
    "isCompleted": false,
    "isAiGenerated": true,
    "createdAt": "2026-04-16T21:08:34.000Z",
    "updatedAt": "2026-04-16T21:08:34.000Z"
  }
]
```

**Error Scenarios:**

| Status | Scenario                          | Response                                              |
| ------ | --------------------------------- | ----------------------------------------------------- |
| 400    | Missing `objective` or `apiKey`   | Validation error                                      |
| 401    | Invalid/expired API key           | "API Key inválida ou sem permissão"                   |
| 429    | Too many requests to Gemini       | "Limite de requisições da API de IA atingido"         |
| 502    | Invalid JSON response from AI     | "A IA retornou uma resposta em formato inesperado"    |
| 503    | Timeout (>30s)                    | "O serviço de IA não respondeu a tempo"               |
| 422    | AI response missing `tasks` field | "A resposta da IA não contém o formato esperado"      |
| 422    | Empty `tasks` array               | "A IA não conseguiu gerar tarefas para este objetivo" |

---

## Environment Variables

### Configuration File: `.env`

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./data/tasks.db

# Gemini API
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models
GEMINI_MODEL=gemini-1.5-flash

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Variable Reference

| Variable         | Type   | Default                                                 | Purpose                              | Required |
| ---------------- | ------ | ------------------------------------------------------- | ------------------------------------ | -------- |
| `PORT`           | Number | 3000                                                    | Server port                          | No       |
| `NODE_ENV`       | String | development                                             | Environment (development/production) | No       |
| `DATABASE_PATH`  | String | ./data/tasks.db                                         | SQLite database file location        | No       |
| `GEMINI_API_KEY` | String | —                                                       | Google Gemini API key                | **Yes**  |
| `GEMINI_API_URL` | String | https://generativelanguage.googleapis.com/v1beta/models | Gemini API endpoint                  | No       |
| `GEMINI_MODEL`   | String | gemini-1.5-flash                                        | LLM model to use                     | No       |
| `CORS_ORIGIN`    | String | http://localhost:3000                                   | Frontend origin for CORS             | No       |

### Security Notes

- **`GEMINI_API_KEY`** is **never logged** (security requirement)
- `.env` must be in `.gitignore` (includes secrets)
- `.env.example` is committed to source control (template only)

---

## Core Workflows

### Workflow 1: Manual Task Creation

```
User Request: POST /tasks { title: "..." }
              ↓
     Controller validates DTO
              ↓
     Service: create(createTaskDto)
              ↓
     Repository: save(task)
              ↓
     Database: INSERT tasks
              ↓
     Return 201 with created task
```

**Error Points:**

- Validation fails → 400
- Database error → 500

---

### Workflow 2: AI Task Generation

```
User Request: POST /ai/generate { objective, apiKey }
              ↓
     Controller validates DTO
              ↓
     AiService.generateTasks()
              ↓
     Build prompt with objective
              ↓
     GeminiProvider.complete(prompt, apiKey)
              ↓
     HTTP POST to Gemini API
              ↓
     Parse & Validate JSON response
              ↓
     Persist each task (isAiGenerated=true)
              ↓
     Return 201 with created tasks
```

**Error Points (8 scenarios):**

1. **Timeout (>30s)** → 503 ServiceUnavailableException
2. **Invalid JSON** → 502 BadGatewayException
3. **Missing `tasks` field** → 422 UnprocessableEntityException
4. **Empty `tasks` array** → 422 UnprocessableEntityException
5. **HTTP 401/403 from Gemini** → 401 UnauthorizedException
6. **HTTP 429 from Gemini** → 429 TooManyRequestsException
7. **Network error** → 502 BadGatewayException
8. **Invalid `apiKey`** → 401 UnauthorizedException

---

## Error Handling Strategy

### Global Exception Filter

All exceptions are caught by `HttpExceptionFilter` and formatted uniformly:

```json
{
  "statusCode": <HTTP_CODE>,
  "message": "<user-friendly description>",
  "error": "<error-type>",
  "timestamp": "ISO-8601",
  "path": "<request-path>"
}
```

### NestJS Built-in Exceptions

Use native NestJS exceptions for standard cases:

```typescript
throw new NotFoundException("Task not found");
throw new BadRequestException("Invalid task data");
throw new UnauthorizedException("Invalid API key");
throw new BadGatewayException("LLM returned invalid response");
throw new ServiceUnavailableException("LLM service timeout");
throw new TooManyRequestsException("Rate limit exceeded");
throw new UnprocessableEntityException("Cannot process this request");
```

### Validation Errors

The global `ValidationPipe` automatically handles invalid DTOs:

```json
{
  "statusCode": 400,
  "message": [
    "title must be a string",
    "title must be shorter than or equal to 500 characters"
  ],
  "error": "Bad Request",
  "timestamp": "2026-04-16T21:08:34.769Z",
  "path": "/tasks"
}
```

### Logging Policy

- ✅ Log successful requests (via LoggingInterceptor)
- ✅ Log errors with context
- ✅ Log all significant user interactions (e.g., task creation, AI generation requests) via `LoggerService`
- ✅ Log Gemini API communications (request details, responses, errors) via `LoggerService`, ensuring sensitive data exclusion
- ❌ **NEVER log API keys** (security requirement, enforced by `LoggerService` and code reviews)
- ❌ NEVER log sensitive user data

---

## Testing Strategy

### Scope

- **Unit tests** for all Service and Provider classes
- **Integration tests** for Controllers (with mocked services)
- **No E2E tests** for MVP (can add later)

### Tools

- **Jest** — Test runner
- **@nestjs/testing** — NestJS Test Module
- **Mock functions** — Isolate external dependencies

### Test Locations

```
src/
  tasks/
    tests/
      tasks.service.spec.ts    (7 tests)
      tasks.controller.spec.ts (integration)
  ai/
    tests/
      ai.service.spec.ts       (8 tests)
```

### Coverage Target

- **Service layer** — 80%+ coverage
- **Provider layer** — 100% coverage of error scenarios
- **Controller layer** — Integration tests (no logic to cover)

### Example Test

```typescript
it("should create a task with isAiGenerated=false", async () => {
  const createDto = { title: "Test task" };
  const result = await service.create(createDto);

  expect(result.title).toBe("Test task");
  expect(result.isAiGenerated).toBe(false);
  expect(mockRepository.save).toHaveBeenCalled();
});
```

---

## Changelog

### v1.2 — AI Module & Infrastructure (Phase 3 & 4)

**Date:** 2026-04-16

**What Changed:**

- ✅ Implemented GeminiProvider (HTTP client for Gemini API with 30s timeout)
- ✅ Created GenerateTasksDto and AiResponseDto with validation
- ✅ Implemented AiService with:
  - Structured prompt engineering (Portuguese, strict format)
  - Response validation (JSON parsing, format checking)
  - Task persistence with `isAiGenerated: true`
  - All 8 error scenarios mapped to HTTP exceptions
- ✅ Implemented AiController (POST /ai/generate with Swagger docs)
- ✅ Created 8 unit tests for AiService (all error paths + success)
- ✅ Enhanced Swagger documentation with servers and better descriptions
- ✅ Created Dockerfile (multi-stage build: builder + production)
- ✅ Fixed TypeScript strict compilation

**Error Scenarios Implemented & Tested:**

1. Invalid JSON response → 502 BadGatewayException
2. Missing `tasks` field → 502 BadGatewayException
3. Empty `tasks` array → 422 UnprocessableEntityException
4. Timeout (>30s) → 503 ServiceUnavailableException
5. HTTP 401 from Gemini → 401 UnauthorizedException
6. HTTP 403 from Gemini → 401 UnauthorizedException
7. HTTP 429 (rate limit) → 429 HttpException
8. HTTP 5xx errors → 502 BadGatewayException

**Files Created:**

- `src/ai/providers/gemini.provider.ts` — Gemini API client
- `src/ai/dto/generate-tasks.dto.ts` — Input DTO with validation
- `src/ai/dto/ai-response.dto.ts` — Response DTO
- `src/ai/ai.service.ts` — Core AI logic with error handling
- `src/ai/ai.controller.ts` — HTTP endpoint
- `src/ai/tests/ai.service.spec.ts` — 8 comprehensive tests
- `src/ai/ai.module.ts` — Updated with dependencies
- `Dockerfile` — Multi-stage production build
- Enhanced `src/main.ts` — Improved Swagger docs

**Test Results:**

```
PASS src/tasks/tests/tasks.service.spec.ts (7 tests)
PASS src/tasks/tests/tasks.controller.spec.ts (7 tests)
PASS src/ai/tests/ai.service.spec.ts (8 tests)
Tests: 25 passed, 25 total
```

**API Endpoints Complete:**

```
✅ GET /tasks — List all tasks
✅ POST /tasks — Create task (201)
✅ GET /tasks/:id — Get single task
✅ PATCH /tasks/:id — Update task
✅ DELETE /tasks/:id — Delete task (204)
✅ POST /ai/generate — Generate tasks from objective (201)
```

**Build & Deployment:**

- ✅ `npm run build` — Zero errors, zero warnings
- ✅ `npm test` — All 25 tests pass
- ✅ Dockerfile ready for containerization
- ✅ .env.example with all variables documented

**Key Features:**

- **Security:** API keys never logged, only passed at runtime
- **Type Safety:** Strict TypeScript, no `any` types
- **Clean Architecture:** Layer separation enforced (Controller → Service → Repository/Provider)
- **Error Handling:** Global exception filter with standardized responses
- **Documentation:** Full Swagger docs with examples and error codes
- **Testing:** 100% unit test coverage of business logic

---

### v1.1 — Tasks Module (Phase 2)

**Date:** 2026-04-16

**What Changed:**

- ✅ Implemented Task entity with TypeORM decorators
- ✅ Created DTOs: CreateTaskDto, UpdateTaskDto, TaskResponseDto with Swagger decorators
- ✅ Implemented TasksRepository (data access layer)
- ✅ Implemented TasksService (business logic with error handling)
- ✅ Implemented TasksController (HTTP endpoints with full Swagger docs)
- ✅ Created 7 unit tests for TasksService (all scenarios)
- ✅ Created 7 unit tests for TasksController (integration)
- ✅ Configured Jest for test runner
- ✅ Fixed TypeScript strict mode (set strictPropertyInitialization: false for decorators)

**Files Created:**

- `src/tasks/entities/task.entity.ts` — TypeORM Task entity
- `src/tasks/dto/create-task.dto.ts` — DTO with validation
- `src/tasks/dto/update-task.dto.ts` — Partial update DTO
- `src/tasks/dto/task-response.dto.ts` — Response DTO with Swagger docs
- `src/tasks/tasks.repository.ts` — Repository with CRUD methods
- `src/tasks/tasks.service.ts` — Service with business logic
- `src/tasks/tasks.controller.ts` — Controller with 5 endpoints (GET/POST/PATCH/DELETE)
- `src/tasks/tests/tasks.service.spec.ts` — 7 unit tests
- `src/tasks/tests/tasks.controller.spec.ts` — 7 integration tests
- `jest.config.js` — Jest configuration
- `src/tasks/tasks.module.ts` — Updated with TypeORM and dependency injection

**Test Results:**

```
PASS src/tasks/tests/tasks.service.spec.ts
PASS src/tasks/tests/tasks.controller.spec.ts
Tests: 14 passed, 14 total
```

**API Endpoints Implemented:**

- `GET /tasks` — List all tasks
- `POST /tasks` — Create task (returns 201)
- `GET /tasks/:id` — Get single task
- `PATCH /tasks/:id` — Update task
- `DELETE /tasks/:id` — Delete task (returns 204)

---

### v1.0 — Foundation Phase

**Date:** 2026-04-16

**What Changed:**

- ✅ Initialized NestJS project with TypeScript configuration
- ✅ Set up ConfigModule for environment management
- ✅ Configured TypeORM with SQLite
- ✅ Implemented global exception filter (HttpExceptionFilter)
- ✅ Implemented global logging interceptor
- ✅ Set up Swagger documentation in main.ts
- ✅ Created `.env.example` and `.env` (local config)
- ✅ Defined TRD.md with complete architecture and API contract
- ✅ Placeholder modules (tasks, ai) ready for Phase 2/3

**Files Created:**

- `package.json` — Dependencies (NestJS, TypeORM, Swagger, etc.)
- `tsconfig.json` — TypeScript configuration
- `.env` / `.env.example` — Environment templates
- `.gitignore` — Exclude secrets and build artifacts
- `src/main.ts` — Bootstrap with Swagger setup
- `src/app.module.ts` — Root module with ConfigModule and TypeORM
- `src/config/configuration.ts` — Config factory
- `src/common/filters/http-exception.filter.ts` — Global exception handler
- `src/common/interceptors/logging.interceptor.ts` — Request logging
- `src/tasks/tasks.module.ts` — Tasks module (placeholder)
- `src/ai/ai.module.ts` — AI module (placeholder)
- `TRD.md` — Technical requirements document

## Project Conventions

### File Naming

- Modules: `*.module.ts`
- Services: `*.service.ts`
- Controllers: `*.controller.ts`
- Repositories: `*.repository.ts`
- Entities: `*.entity.ts`
- DTOs: `*.dto.ts`
- Tests: `*.spec.ts`
- Filters: `*.filter.ts`
- Interceptors: `*.interceptor.ts`

### TypeScript Rules

1. ✅ **Strict Mode** — `strict: true` in tsconfig
2. ❌ **No `any`** — Use `unknown` with type guards if needed
3. ✅ **Explicit Types** — Always annotate function returns
4. ❌ **No `.then()/.catch()` chains** — Always use `async/await`
5. ✅ **Const by default** — Use `let` only when necessary

### Code Style

- 2-space indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in multi-line arrays/objects
- Comments only for non-obvious logic
- Classes and interfaces use PascalCase
- Variables and functions use camelCase

---

## How to Run

### Development

```bash
# Install dependencies
npm install

# Start watch mode
npm run start:dev

# Swagger UI available at http://localhost:3000/api/docs
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

### Production

```bash
# Build
npm run build

# Start
npm run start:prod
```

---

**End of TRD.md**

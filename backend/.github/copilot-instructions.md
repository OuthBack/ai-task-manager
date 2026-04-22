# Copilot Instructions for Backend Repository

## Project Overview

**AI Task Manager Backend** — NestJS REST API that manages tasks and integrates with Google's Gemini AI for automatic task generation from natural language objectives. The system includes both manual CRUD operations and AI-powered task generation.

## Build, Test & Lint Commands

### Development
- **Start dev server** (watch mode): `npm run start:dev`
- **Start with debugging**: `npm run start:debug` (port 9229)
- **Production build**: `npm run build`
- **Run built app**: `npm run start:prod`

### Testing
- **Run all tests**: `npm test`
- **Run single test file**: `npm test -- <test-file-name>`
  - Example: `npm test -- tasks.controller.spec.ts`
- **Watch mode** (re-run on changes): `npm test -- --watch`
- **Coverage report**: `npm test:cov`
- **Debug tests**: `npm run test:debug` (port 9229)

### Code Quality
- **Lint with fixes**: `npm run lint`
- **Format code**: `npm run format`

### Database
- Uses SQLite3 with TypeORM. Database file path configured via `DATABASE_PATH` env var (default: `./data/tasks.db`)
- TypeORM `synchronize: true` auto-creates/syncs schema on startup

## Architecture

### Module Structure
```
src/
├── tasks/          # Manual task CRUD operations
│   ├── entities/   # Task entity (TypeORM)
│   ├── dto/        # Data transfer objects (Create, Update, Response)
│   ├── tasks.repository.ts
│   ├── tasks.service.ts
│   ├── tasks.controller.ts
│   └── tests/      # Controller + Service tests
├── ai/             # AI-powered task generation
│   ├── dto/        # Generate request & response DTOs
│   ├── providers/  # Gemini API provider (implements external API calls)
│   ├── ai.service.ts
│   ├── ai.controller.ts
│   └── tests/
├── common/         # Shared infrastructure
│   ├── filters/    # HTTP exception filter (global error handling)
│   ├── interceptors/ # Logging interceptor (request/response logging)
│   └── pipes/      # Validation pipes (if used)
└── config/         # Configuration service (env vars loaded here)
```

### Key Design Patterns
1. **Service Layer Pattern**: Business logic isolated in `*.service.ts`, controllers delegate to services
2. **Repository Pattern**: Data access abstracted in `*.repository.ts`, services call repositories
3. **DTOs for API Contracts**: Separate input/output DTOs using class-validator decorators for validation
4. **Global Error Handling**: `HttpExceptionFilter` catches and formats all HTTP exceptions
5. **Logging Interceptor**: All requests/responses logged globally
6. **Configuration-Driven**: Environment variables loaded via NestJS ConfigService (typed, centralized)

### Data Flow Example (Task Creation)
```
POST /tasks → Controller → Service (business logic) → Repository → TypeORM → SQLite
Response: TaskResponseDto (shape controlled by DTO)
```

### AI Integration Flow
```
POST /ai/generate → Controller → Service:
  1. Build prompt (Portuguese instructions to Gemini)
  2. Call Gemini Provider with API key
  3. Parse JSON response (strict validation)
  4. Create Task entities via repository
  5. Return created tasks to client
```

## Key Conventions

### Naming & File Organization
- Controllers: `<domain>.controller.ts` (e.g., `tasks.controller.ts`)
- Services: `<domain>.service.ts`
- Repositories: `<domain>.repository.ts`
- Entities: `<entity>.entity.ts` (in `entities/` folder)
- DTOs: `<action>-<entity>.dto.ts` (e.g., `create-task.dto.ts`, `task-response.dto.ts`)
- Test files: `<file-to-test>.spec.ts` (co-located in `tests/` folders)

### DTO & Validation
- Use `class-validator` decorators (`@IsString()`, `@IsNotEmpty()`, etc.)
- Separate request (create/update) DTOs from response DTOs
- Response DTOs use `@ApiProperty()` for Swagger documentation
- `ValidationPipe` globally enforces: whitelist strict, transform enabled, implicit conversion on

### Error Handling
- Throw NestJS HttpException subclasses: `NotFoundException`, `BadGatewayException`, `UnauthorizedException`, etc.
- `HttpExceptionFilter` catches and returns `{ statusCode, message }` format
- Service layer should check resource existence before operations (e.g., `findOne()` in update/delete)

### Logging
- Use `Logger` from `@nestjs/common`
- Logging interceptor handles request/response logging automatically
- AI service includes explicit error logging for LLM failures

### API Documentation (Swagger)
- Controllers decorated with `@ApiTags()` for grouping
- Endpoints have `@ApiOperation()` summary
- Use `@ApiResponse()` for status codes + response types
- `@ApiParam()` for path parameters
- All documented at `/api/docs` on startup

### Testing Conventions
- Mock dependencies using `jest.fn()`
- Use `Test.createTestingModule()` for module setup
- Mock data should match actual entity structure
- Test both happy path and error cases (e.g., NotFoundException)

### Configuration
- All env vars loaded in `src/config/configuration.ts`
- Access via `ConfigService.get<Type>('key.path')`
- Supports nested config objects (e.g., `gemini.apiUrl`, `database.path`, `cors.origin`)
- `.env.example` shows all required vars for reference
- **IMPORTANT**: Each developer must have their own `.env` file with a valid Gemini API key
  - Get key from: https://ai.google.dev/
  - `.env` is in `.gitignore` and must never be committed
  - API key is never logged (security requirement per TRD)

### TypeScript
- Strict mode enabled: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
- Path aliases: `@/*` maps to `src/*` (use for imports instead of relative paths)
- Decorator metadata required: `experimentalDecorators: true`, `emitDecoratorMetadata: true`
- ES2020 target

### Async/Promises
- All data-fetching methods are `async` and return `Promise<T>`
- Services chain repository calls
- Use `await` for sequential operations, avoid unhandled promise rejections

## Important Files
- `main.ts` — Application bootstrap, global pipes/filters/interceptors setup, Swagger config
- `app.module.ts` — Root module, database connection, feature modules import
- `.env.example` — Reference for required environment variables
- `jest.config.js` — Test configuration (tests in `**/*.spec.ts`, excludes modules/main/index)

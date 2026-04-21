import { NestFactory, Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>("port") || 3000;
  const corsOrigin =
    configService.get<string>("cors.origin") || "http://localhost:3000";

  // Enable CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global pipes
  /*
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  */

  // Global filters
  app.useGlobalFilters();

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("AI Task Manager API")
    .setDescription(
      "REST API for managing tasks and integrating with Gemini AI for automatic task generation from natural language objectives.",
    )
    .setVersion("1.0")
    .addTag("tasks", "Endpoints for manual task management (CRUD)")
    .addTag("ai", "Endpoints for AI-powered task generation")
    .addServer(`http://localhost:${port}`, "Local development")
    .addServer("https://api.example.com", "Production")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("/docs", app, document);

  await app.listen(port, () => {
    console.log(`🚀 Application is running on http://localhost:${port}`);
  });
}

bootstrap();

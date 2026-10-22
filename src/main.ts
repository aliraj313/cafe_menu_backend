import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/filters/app-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const frontendOrigin = configService.get<string>('FRONTEND_ORIGIN', 'http://localhost:5173');

  app.setGlobalPrefix(apiPrefix, {
    exclude: ['docs', 'docs/(.*)', 'openapi.json'],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AppExceptionFilter());

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });

  if (nodeEnv !== 'production') {
    const openApiConfig = new DocumentBuilder()
      .setTitle('Cafe Menu Backend')
      .setDescription('API for Persian cafe and restaurant menu application')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, openApiConfig);

    // Expose raw OpenAPI JSON for Scalar / external tools
    app.getHttpAdapter().get('/openapi.json', (_req: unknown, res: { json: (body: unknown) => void }) => {
      res.json(document);
    });

    app.use(
      '/docs',
      apiReference({
        content: document,
        theme: 'default',
        darkMode: true,
      }),
    );
  }

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}/${apiPrefix}`);
  if (nodeEnv !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`API docs (Scalar): http://localhost:${port}/docs`);
  }
}

bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start application', err);
  process.exit(1);
});

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { ConfigsService, isProduction } from './config/configs.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configs = app.get(ConfigsService);

  app.setGlobalPrefix(configs.API_PREFIX, {
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
    origin: configs.FRONTEND_ORIGIN,
    credentials: true,
  });

  if (!isProduction()) {
    const openApiConfig = new DocumentBuilder()
      .setTitle('Cafe Menu Backend')
      .setDescription('API for Persian cafe and restaurant menu application')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, openApiConfig);

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

  await app.listen(configs.PORT);
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${configs.PORT}/${configs.API_PREFIX}`);
  if (!isProduction()) {
    // eslint-disable-next-line no-console
    console.log(`API docs (Scalar): http://localhost:${configs.PORT}/docs`);
  }
}

bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start application', err);
  process.exit(1);
});

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { ConfigsService } from './config/configs.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configs = app.get(ConfigsService);

  app.setGlobalPrefix(configs.API_PREFIX, {
    exclude: [...configs.APP.DOCS_EXCLUDE_ROUTES],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configs.APP.API_DEFAULT_VERSION,
  });

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

  if (configs.NODE_ENV !== 'production') {
    const openApiConfig = new DocumentBuilder()
      .setTitle(configs.APP.NAME)
      .setDescription(configs.APP.DESCRIPTION)
      .setVersion(configs.APP.OPENAPI_VERSION)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, openApiConfig);

    app.getHttpAdapter().get(
      `/${configs.APP.OPENAPI_JSON_PATH}`,
      (_req: unknown, res: { json: (body: unknown) => void }) => {
        res.json(document);
      },
    );

    app.use(
      `/${configs.APP.DOCS_PATH}`,
      apiReference({
        content: document,
        theme: configs.APP.SCALAR_THEME,
        darkMode: configs.APP.SCALAR_DARK_MODE,
      }),
    );
  }

  await app.listen(configs.PORT);
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${configs.PORT}/${configs.API_PREFIX}`);
  if (configs.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`API docs (Scalar): http://localhost:${configs.PORT}/${configs.APP.DOCS_PATH}`);
  }
}

bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start application', err);
  process.exit(1);
});

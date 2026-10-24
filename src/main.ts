import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ConfigsService } from './config/configs.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configs = app.get(ConfigsService);

  // Fixed API prefix (not env-driven). Do not stack URI versioning on top.
  const apiPrefix = 'api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      ...configs.APP.DOCS_EXCLUDE_ROUTES,
      configs.STORAGE.PUBLIC_PATH.replace(/^\//, ''),
      `${configs.STORAGE.PUBLIC_PATH.replace(/^\//, '')}/(.*)`,
    ],
  });

  // Serve uploaded files at /storage/*
  app.useStaticAssets(join(process.cwd(), configs.STORAGE.ROOT_DIR), {
    prefix: configs.STORAGE.PUBLIC_PATH,
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
  app.useGlobalInterceptors(new ResponseInterceptor());

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

    const http = app.getHttpAdapter();
    http.get(`/${configs.APP.OPENAPI_JSON_PATH}`, (_req: unknown, res: unknown) => {
      (res as { json: (body: unknown) => void }).json(document);
    });

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
  console.log(`Server running on http://localhost:${configs.PORT}/${apiPrefix}`);
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

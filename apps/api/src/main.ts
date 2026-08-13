import 'reflect-metadata';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from '@/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, 'public'));

  // Enable CORS — restrict to configured origins in production.
  // CORS_ORIGIN is a comma-separated list of https URLs. Unset locally to allow all origins.
  const corsOrigin = process.env.CORS_ORIGIN;
  const origins = corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : undefined;
  app.enableCors(origins ? { origin: origins } : undefined);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI documentation
  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Chamuco Travel API')
      .setDescription('API documentation for Chamuco Travel application')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth')
      // users sub-tags
      .addTag('users')
      .addTag('user-profile', '', undefined, { parent: 'users' })
      .addTag('user-health', '', undefined, { parent: 'users' })
      .addTag('user-emergency-contacts', '', undefined, { parent: 'users' })
      .addTag('user-travel-docs', '', undefined, { parent: 'users' })
      .addTag('user-loyalty-programs', '', undefined, { parent: 'users' })
      .addTag('user-preferences', '', undefined, { parent: 'users' })
      .addTag('invitation-tokens', '', undefined, { parent: 'users' })
      // groups sub-tags
      .addTag('groups')
      .addTag('group-members', '', undefined, { parent: 'groups' })
      .addTag('group-invitations', '', undefined, { parent: 'groups' })
      .addTag('group-join-requests', '', undefined, { parent: 'groups' })
      .addTag('group-announcements', '', undefined, { parent: 'groups' })
      // trips sub-tags
      .addTag('trips')
      .addTag('trip-destinations', '', undefined, { parent: 'trips' })
      .addTag('trip-groups', '', undefined, { parent: 'trips' })
      .addTag('trip-announcements', '', undefined, { parent: 'trips' })
      .addTag('trip-participants', '', undefined, { parent: 'trips' })
      .addTag('trip-invitations', '', undefined, { parent: 'trips' })
      .addTag('trip-join-requests', '', undefined, { parent: 'trips' })
      .addTag('trip-tasks', '', undefined, { parent: 'trips' })
      // Root-level tags — standalone
      .addTag('notifications')
      .addTag('uploads')
      .addTag('locations')
      .addTag('feedback')
      .addTag('health')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    app.use(
      '/docs',
      apiReference({
        content: document,
        favicon: '/favicon.ico',
        metaData: {
          title: 'Chamuco Travel API',
          ogTitle: 'Chamuco Travel API',
          ogImage: '/logo.png',
        },
      }),
    );
  }

  // Start server
  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(`API docs (Scalar) available at: http://localhost:${port}/docs`);
  }
}

bootstrap();

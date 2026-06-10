import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '@/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

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
      // Root-level tags — standalone
      .addTag('notifications')
      .addTag('uploads')
      .addTag('locations')
      .addTag('feedback')
      .addTag('health')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // Start server
  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(`Swagger UI available at: http://localhost:${port}/docs`);
  }
}

bootstrap();

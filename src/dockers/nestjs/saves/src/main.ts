import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }))

  const config = new DocumentBuilder()
    .setTitle('Backend API')
    .setDescription('NestJS Core API Documention')
    .setVersion('1.0')
    .addServer('/nestjs', 'Relative Base Path')
    .addBearerAuth()
    .build()


  console.log({
    googleClientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
    googleSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.OAUTH_GOOGLE_CALLBACK_URL
  });

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

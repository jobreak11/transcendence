import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { NestFastifyApplication, FastifyAdapter } from "@nestjs/platform-fastify"
import fastifyMultipart from "@fastify/multipart"
import { GLOBAL_LIMIT_FASTIFY_MULTIPART_FILE_FIELD_MAX, GLOBAL_LIMIT_FASTIFY_MULTIPART_FILESIZE_LIMIT } from './constant.js';
import fastifyCookie from "@fastify/cookie"

async function bootstrap() {

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  )

  // const app = await NestFactory.create(AppModule);
  //app.useGlobalPipes(new ValidationPipe({
  //  transform: true,
  //  whitelist: true
  //}))
  app.register(fastifyCookie);

  app.register(fastifyMultipart, {
    limits: {
      fileSize: GLOBAL_LIMIT_FASTIFY_MULTIPART_FILESIZE_LIMIT,
      files: GLOBAL_LIMIT_FASTIFY_MULTIPART_FILE_FIELD_MAX,
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Backend API')
    .setDescription('NestJS Core API Documention')
    .setVersion('1.0')
    .addServer('/api', 'Relative Base Path')
    .addBearerAuth()
    .build()

  console.log({
    googleClientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
    googleSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.OAUTH_GOOGLE_CALLBACK_URL
  });

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('admin/api-docs', app, document);
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();

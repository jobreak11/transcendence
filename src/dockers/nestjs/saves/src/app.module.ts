import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { ConfigModule } from '@nestjs/config';

// first step here is i want to test the authentication module first
// but  for that to happen i need to connect to database which i already
// connect the backend with the database
// the next thing is try to configure how to give jwt token and store the
// refresh token in the database in the hashing way

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule]
})
export class AppModule {}

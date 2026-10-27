import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { dbRelations, dbSchema } from './schema/schema.js';
import { Pool } from 'pg';

//@Module({
//  imports: [
//    NestDrizzleModule.forRootAsync({
//      imports: [ConfigModule],
//      inject: [ConfigService],
//      useFactory: (configService: ConfigService) => ({
//        drizzle,
//        connection: {
//          host: configService.getOrThrow<string>('POSTGRES_HOST'),
//          port: parseInt(configService.getOrThrow<string>('POSTGRES_PORT'), 10),
//          database: configService.getOrThrow<string>('POSTGRES_DB'),
//          user: configService.getOrThrow<string>('POSTGRES_USER'),
//          password: configService.getOrThrow<string>('POSTGRES_PASSWORD'),
//          ssl: false,
//        },
//      }),
//    }),
//  ],
//  exports: [NestDrizzleModule],
//})
//export class DrizzleModule {}

export const DRIZZLE = Symbol('DRIZZLE')

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const pool = new Pool({
          host: config.getOrThrow('POSTGRES_HOST'),
          port: parseInt(config.getOrThrow('POSTGRES_PORT'), 10),
          database: config.getOrThrow('POSTGRES_DB'),
          user: config.getOrThrow('POSTGRES_USER'),
          password: config.getOrThrow('POSTGRES_PASSWORD'),
          ssl: false
        });

        return drizzle({client: pool, relations: dbRelations})
      }
    }
  ],
  exports: [DRIZZLE]

})
export class DrizzleModule {}
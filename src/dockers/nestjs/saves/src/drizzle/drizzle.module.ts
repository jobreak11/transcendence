import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg'
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from './schema/schema.js'

export const DRIZZLE = Symbol("drizzle-connection");

@Module({
	providers: [
		{
			provide: DRIZZLE,
			inject: [ConfigService],
			useFactory: async (configService:ConfigService) => {
				const type = 'postgres';
				const host = configService.getOrThrow<string>('POSTGRES_HOST');
				const port = parseInt( configService.getOrThrow<string>('POSTGRES_PORT'), 10);
				const database = configService.getOrThrow<string>('POSTGRES_DB');
				const username = configService.getOrThrow<string>('POSTGRES_USER');
				const password = configService.getOrThrow<string>('POSTGRES_PASSWORD');
				const autoLoadEntities = true;
				const synchronize = configService.getOrThrow('POSTGRES_SYNC') === 'true';

				const pool = new Pool({
					host: host,
					port: port,
					database: database,
					user: username,
					password: password,
					ssl: false
				})

				return drizzle(pool, {schema}) as NodePgDatabase<typeof schema>;
			}
		}
	],
	exports: [DRIZZLE]
})
export class DrizzleModule {}

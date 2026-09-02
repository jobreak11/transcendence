import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm"
import { ConfigService } from "@nestjs/config"

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			useFactory: (configService: ConfigService ) => ({
				type: 'postgres',
				host: configService.getOrThrow<string>('POSTGRES_HOST'),
				port: configService.getOrThrow<number>('POSTGRES_PORT'),
				database: configService.getOrThrow<string>('POSTGRES_DB'),
				username: configService.getOrThrow<string>('POSTGRES_USER'),
				password: configService.getOrThrow<string>('POSTGRES_PASSWORD'),
				autoLoadEntities: true,
				synchronize: configService.getOrThrow('POSTGRES_SYNC'),
			}),
			inject: [ConfigService],
		})
	]
})
export class DatabaseModule {}

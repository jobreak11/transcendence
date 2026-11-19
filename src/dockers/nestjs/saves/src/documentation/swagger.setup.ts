import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { PublicModule } from "../api/public/public.module.js";
import { InternalModule } from "../api/internal/internal.module.js";

export function setupSwagger(app: INestApplication): void {
    const publicConfig = new DocumentBuilder()
        .setTitle('Public API')
        .setDescription('Endpoints available to external clients.')
        .setVersion('1.0')
        .addBearerAuth()
        .addServer('/api', 'Relative Base Path')
        .build();

    const publicDocument = SwaggerModule.createDocument(
        app,
        publicConfig,
        {
            include: [PublicModule],
            deepScanRoutes: true
        },
    );

    SwaggerModule.setup('admin/public/api-docs', app, publicDocument, {
    });

    const internalConfig = new DocumentBuilder()
        .setTitle('Internal API')
        .setDescription('Endpoints for authorized internal consumers.')
        .addBearerAuth()
        .addServer('/api', 'Relative Base Path')
        .setVersion('1.0')
        .build();
    
    const internalDocument = SwaggerModule.createDocument(
        app,
        internalConfig,
        {
            include: [InternalModule],
            deepScanRoutes: true,
        },
    );

    SwaggerModule.setup('admin/api-docs', app, internalDocument);
}
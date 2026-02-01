import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });
dotenv.config({ path: resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VenuesModule } from './module';

async function bootstrap() {
    const app = await NestFactory.create(VenuesModule);
    app.enableCors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/], credentials: true });

    const config = new DocumentBuilder()
        .setTitle('Mangwale v2 Venues')
        .setDescription('Venue types, slots, and bookings with smart slot generation')
        .setVersion('0.0.1')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    const port = process.env.PORT || 4007;
    await app.listen(port);
    console.log(`Venues running on http://localhost:${port}`);
    console.log(`Swagger docs available at http://localhost:${port}/docs`);
}
bootstrap();

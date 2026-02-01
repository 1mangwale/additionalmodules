import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
// Load root .env (monorepo) first, then local app .env; use __dirname for robust resolution
dotenv.config({ path: resolve(__dirname, '../../../.env') });
dotenv.config({ path: resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RoomsModule } from './module';

async function bootstrap() {
  const app = await NestFactory.create(RoomsModule);
  app.enableCors({ origin: [/^http:\/\/localhost:(51\d{2}|5183|5184|\d+)$/, /^http:\/\/127\.0\.0\.1:(51\d{2}|5183|5184|\d+)$/], credentials: true });
  const config = new DocumentBuilder()
    .setTitle('Mangwale v2 Rooms')
    .setDescription('Rooms search/booking')
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  const port = process.env.PORT ? Number(process.env.PORT) : 4001;
  await app.listen(port);
  console.log(`Rooms running on http://localhost:${port}`);
}
bootstrap();

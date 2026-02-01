import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });
dotenv.config({ path: resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ServicesModule } from './module';

async function bootstrap() {
  const app = await NestFactory.create(ServicesModule);
  app.enableCors({ origin: [/^http:\/\/localhost:(51\d{2}|5183|5184|\d+)$/, /^http:\/\/127\.0\.0\.1:(51\d{2}|5183|5184|\d+)$/], credentials: true });
  const config = new DocumentBuilder()
    .setTitle('Mangwale v2 Services')
    .setDescription('Services catalog/slots/appointments')
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  const port = process.env.PORT ? Number(process.env.PORT) : 4002;
  await app.listen(port);
  console.log(`Services API running on http://localhost:${port}`);
}
bootstrap();

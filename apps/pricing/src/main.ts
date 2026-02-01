import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../../../.env') });
dotenv.config({ path: resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PricingModule } from './module';

async function bootstrap() {
  const app = await NestFactory.create(PricingModule);
  const config = new DocumentBuilder()
    .setTitle('Mangwale v2 Pricing')
    .setDescription('Dynamic slab pricing service')
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  const port = process.env.PORT ? Number(process.env.PORT) : 4003;
  await app.listen(port);
  console.log(`Pricing running on http://localhost:${port}`);
}
bootstrap();

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BridgeModule } from './module';

async function bootstrap() {
  const app = await NestFactory.create(BridgeModule);
  const config = new DocumentBuilder()
    .setTitle('Mangwale v2 Finance Bridge')
    .setDescription('Internal bridge to v1 wallet/payments')
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  const port = process.env.PORT ? Number(process.env.PORT) : 4004;
  await app.listen(port);
  console.log(`Finance Bridge running on http://localhost:${port}`);
}
bootstrap();

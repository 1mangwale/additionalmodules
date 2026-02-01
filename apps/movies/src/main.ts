import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
// Load local .env first, then fall back to monorepo root .env
dotenv.config();
if (!process.env.PG_HOST || !process.env.PG_USER) {
  dotenv.config({ path: resolve(__dirname, '../../../.env') });
}
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MoviesModule } from './module';

async function bootstrap() {
  const app = await NestFactory.create(MoviesModule);
  const config = new DocumentBuilder().setTitle('Movies').setDescription('Movies API').setVersion('0.0.1').build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  const port = Number(process.env.MOVIES_PORT || 4005);
  await app.listen(port);
  console.log(`Movies running on http://localhost:${port}`);
}
bootstrap();

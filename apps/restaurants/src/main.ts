import { NestFactory } from '@nestjs/core';
import { RestaurantsModule } from './module';

async function bootstrap() {
  const app = await NestFactory.create(RestaurantsModule);
  app.enableCors();
  const port = process.env.PORT || 4008;
  await app.listen(port);
  console.log(`🍽️  Restaurants service running on port ${port}`);
}

bootstrap();

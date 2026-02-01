import { Module } from '@nestjs/common';
import { HealthController } from './routes.health';
import { ProxyController } from './proxy.controller';

@Module({
  imports: [],
  controllers: [HealthController, ProxyController],
  providers: [],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FinanceClient } from './finance.client';
import { BridgeController } from './routes.bridge';

@Module({
  imports: [HttpModule],
  controllers: [BridgeController],
  providers: [FinanceClient],
  exports: [FinanceClient],
})
export class BridgeModule {}

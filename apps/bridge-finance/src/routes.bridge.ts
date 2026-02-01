import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FinanceClient } from './finance.client';

@ApiTags('bridge')
@Controller('/bridge')
export class BridgeController {
  constructor(private readonly f: FinanceClient) { }

  @Get('/health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { ok: true, service: 'bridge-finance', ts: new Date().toISOString() };
  }

  @Post('/ping')
  @ApiOperation({ summary: 'Ping test' })
  async ping() {
    return { ok: true };
  }

  @Post('/demo/hold')
  async demoHold(@Body() body: any) {
    return this.f.hold(body, body.idempotency_key || 'demo:hold');
  }
}

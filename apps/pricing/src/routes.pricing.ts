import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PricingService } from './svc.pricing';
import { PricingQuoteRequest, PricingQuoteResponse } from '@mangwale/shared';

@ApiTags('pricing')
@Controller('/pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Post('/quote')
  quote(@Body() body: PricingQuoteRequest): Promise<PricingQuoteResponse> {
    return this.pricing.quote(body);
  }
}

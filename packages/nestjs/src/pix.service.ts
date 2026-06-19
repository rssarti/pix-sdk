import { Inject, Injectable } from '@nestjs/common';
import { PixSDK } from '@rssarti/pix-core';
import { PIX_SDK } from './tokens.js';

@Injectable()
export class PixService {
  constructor(@Inject(PIX_SDK) private readonly pix: PixSDK) {}

  get sdk(): PixSDK {
    return this.pix;
  }

  createCharge = (input: Parameters<PixSDK['createCharge']>[0]) => this.pix.createCharge(input);
  getCharge = (id: string) => this.pix.getCharge(id);
  refund = (input: Parameters<PixSDK['refund']>[0]) => this.pix.refund(input);
}

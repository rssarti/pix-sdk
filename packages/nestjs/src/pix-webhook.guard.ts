import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { PixSDK } from '@rssarti/pix-core';
import { PIX_SDK } from './tokens.js';

@Injectable()
export class PixWebhookGuard implements CanActivate {
  constructor(@Inject(PIX_SDK) private readonly pix: PixSDK) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ body: unknown; headers: Record<string, string> }>();
    const secret = process.env.PIX_WEBHOOK_SECRET;
    if (!secret) return true;
    try {
      await this.pix.webhooks.parse(req.body, req.headers, JSON.stringify(req.body));
      return true;
    } catch {
      return false;
    }
  }
}

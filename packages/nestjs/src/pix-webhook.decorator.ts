import { SetMetadata } from '@nestjs/common';

export const PIX_WEBHOOK_KEY = 'pix_webhook';
export const PixWebhook = () => SetMetadata(PIX_WEBHOOK_KEY, true);

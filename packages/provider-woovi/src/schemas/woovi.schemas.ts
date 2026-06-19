import { z } from 'zod';

export const wooviChargeSchema = z.object({
  correlationID: z.string(),
  transactionID: z.string().optional(),
  identifier: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'EXPIRED']),
  value: z.number(),
  comment: z.string().optional(),
  brCode: z.string().optional(),
  qrCodeImage: z.string().optional(),
  paymentLinkUrl: z.string().optional(),
  expiresDate: z.string().optional(),
  expiresIn: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  paidAt: z.string().optional(),
});

export const wooviChargeResponseSchema = z.object({
  charge: wooviChargeSchema,
  correlationID: z.string().optional(),
  brCode: z.string().optional(),
});

export const wooviRefundSchema = z.object({
  correlationID: z.string(),
  status: z.string().optional(),
  value: z.number().optional(),
  endToEndId: z.string().optional(),
  createdAt: z.string().optional(),
});

export const wooviRefundResponseSchema = z.object({
  refund: wooviRefundSchema.optional(),
  correlationID: z.string().optional(),
});

export const wooviSubscriptionSchema = z.object({
  globalID: z.string(),
  value: z.number(),
  status: z.string().optional(),
  dayGenerateCharge: z.number().optional(),
  customer: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      taxID: z.union([z.string(), z.object({ taxID: z.string(), type: z.string().optional() })]).optional(),
    })
    .optional(),
  createdAt: z.string().optional(),
});

export const wooviSubscriptionResponseSchema = z.object({
  subscription: wooviSubscriptionSchema,
});

export type WooviCharge = z.infer<typeof wooviChargeSchema>;
export type WooviRefund = z.infer<typeof wooviRefundSchema>;
export type WooviSubscription = z.infer<typeof wooviSubscriptionSchema>;

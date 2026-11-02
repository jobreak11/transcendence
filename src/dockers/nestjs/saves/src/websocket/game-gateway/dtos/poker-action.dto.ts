import { z } from 'zod';

export const pokerTableIdSchema = z.string().trim().min(1).max(64);

export const startHandSchema = z.object({
  tableSessionId: pokerTableIdSchema,
});

export const actionSchema = z.object({
  tableSessionId: pokerTableIdSchema,
  actionType: z.enum(['FOLD', 'CHECK', 'CALL', 'RAISE']),
  // For RAISE, amount is the number of additional chips to commit.
  amount: z.number().int().positive().optional(),
}).superRefine((action, context) => {
  if (action.actionType === 'RAISE' && action.amount === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['amount'],
      message: 'amount is required for a raise',
    });
  }
});

export type StartHandDto = z.infer<typeof startHandSchema>;
export type PokerActionDto = z.infer<typeof actionSchema>;

// lib/utils/zod-schemas/deadline.ts
// Zod schemas for BIR deadline API routes and components

import { z } from 'zod';

export const BirDeadlineSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  form_type: z.string().min(1),
  due_date: z.string().date(),
  filed: z.boolean(),
  filed_at: z.string().datetime().nullable(),
  notification_sent_7d: z.boolean(),
  notification_sent_3d: z.boolean(),
  notification_sent_1d: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const CreateBirDeadlineSchema = z.object({
  form_type: z.string().min(1, 'Form type is required'),
  due_date: z.string().date('Due date must be a valid date'),
});

export const UpdateBirDeadlineSchema = z.object({
  filed: z.boolean().optional(),
  form_type: z.string().min(1).optional(),
  due_date: z.string().date().optional(),
});

export const GetBirDeadlinesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(BirDeadlineSchema),
});

export type BirDeadline = z.infer<typeof BirDeadlineSchema>;
export type CreateBirDeadlineInput = z.infer<typeof CreateBirDeadlineSchema>;
export type UpdateBirDeadlineInput = z.infer<typeof UpdateBirDeadlineSchema>;

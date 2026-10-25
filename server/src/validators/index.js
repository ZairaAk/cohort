import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const subjectSchema = z.object({
  name: z.string().trim().toLowerCase().min(1).max(40),
  level: z.number().int().min(1).max(5),
});

const slotSchema = z
  .object({
    day: z.number().int().min(0).max(6),
    startMin: z.number().int().min(0).max(1439),
    endMin: z.number().int().min(1).max(1440),
  })
  .refine((s) => s.endMin > s.startMin, { message: 'Slot end must be after start' });

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  subjects: z
    .array(subjectSchema)
    .max(15)
    .refine((list) => new Set(list.map((s) => s.name)).size === list.length, {
      message: 'Duplicate subjects are not allowed',
    }),
  availability: z.array(slotSchema).max(35),
});

export const groupCreateSchema = z.object({
  name: z.string().trim().min(2, 'Group name is too short').max(60),
  subject: z.string().trim().toLowerCase().min(1, 'Subject is required').max(40),
  description: z.string().trim().max(500).default(''),
  weeklyGoalMinutes: z.number().int().min(30).max(5000).default(300),
});

export const groupListQuery = z.object({
  subject: z.string().trim().toLowerCase().max(40).optional(),
  mine: z.enum(['true', 'false']).optional(),
});

export const resourceSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  url: z
    .string()
    .trim()
    .url('Enter a valid URL')
    .refine((u) => /^https?:\/\//i.test(u), { message: 'Only http(s) links are allowed' }),
});

export const questionCreateSchema = z.object({
  title: z.string().trim().min(5, 'Title is too short').max(150),
  body: z.string().trim().min(5, 'Describe your question').max(5000),
  subject: z.string().trim().toLowerCase().min(1).max(40),
  groupId: objectId.optional(),
});

export const questionListQuery = z.object({
  subject: z.string().trim().toLowerCase().max(40).optional(),
  groupId: objectId.optional(),
});

export const answerSchema = z.object({
  body: z.string().trim().min(2, 'Answer is too short').max(5000),
});

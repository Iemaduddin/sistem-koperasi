import { z } from 'zod';
import type { UserForm } from './types';

const baseUserSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Nama harus diisi')
        .max(255, 'Nama maksimal 255 karakter'),
    email: z
        .string()
        .trim()
        .min(1, 'Email harus diisi')
        .email('Format email tidak valid')
        .max(255, 'Email maksimal 255 karakter'),
    is_active: z.enum(['true', 'false']),
    roles: z.array(z.string()).min(1, 'Role minimal 1'),
});

export const createUserSchema = baseUserSchema
    .extend({
        password: z
            .string()
            .min(1, 'Password harus diisi')
            .min(8, 'Password minimal 8 karakter'),
        password_confirmation: z
            .string()
            .min(1, 'Konfirmasi password harus diisi'),
    })
    .refine((data) => data.password === data.password_confirmation, {
        path: ['password_confirmation'],
        message: 'Password dan konfirmasi password tidak cocok',
    });

export const updateUserSchema = baseUserSchema
    .extend({
        password: z.string(),
        password_confirmation: z.string(),
    })
    .superRefine((data, ctx) => {
        if (data.password.length > 0 && data.password.length < 8) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['password'],
                message: 'Password minimal 8 karakter',
            });
        }

        if (data.password.length > 0 && !data.password_confirmation.length) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['password_confirmation'],
                message: 'Konfirmasi password harus diisi',
            });
        }

        if (
            data.password.length > 0 &&
            data.password_confirmation.length > 0 &&
            data.password !== data.password_confirmation
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['password_confirmation'],
                message: 'Password dan konfirmasi password tidak cocok',
            });
        }
    });

export const buildCreatePayload = (data: UserForm): UserForm => ({
    ...data,
    name: data.name.trim(),
    email: data.email.trim(),
    roles: ['Admin'],
    is_active: data.is_active,
});

export const buildUpdatePayload = (data: UserForm): UserForm => ({
    ...data,
    name: data.name.trim(),
    email: data.email.trim(),
    password: data.password ?? '',
    password_confirmation: data.password_confirmation ?? '',
    is_active: data.is_active,
});

export const getFirstValidationError = (error: z.ZodError) =>
    error.issues[0]?.message ?? 'Data tidak valid';

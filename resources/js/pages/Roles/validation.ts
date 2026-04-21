import { z } from 'zod';
import type { RoleForm } from './types';

export const roleSchema = z.object({
    name: z.string().min(1, 'Nama role harus diisi.').max(255),
    permissions: z.array(z.string()).optional(),
});

export const getFirstValidationError = (error: z.ZodError): string => {
    return error.errors[0]?.message ?? 'Terjadi kesalahan validasi.';
};

export const buildPayload = (data: RoleForm) => {
    return {
        name: data.name,
        permissions: data.permissions,
    };
};

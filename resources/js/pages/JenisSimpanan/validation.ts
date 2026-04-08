import { z } from 'zod';
import type { JenisSimpananForm } from './types';

const toNumberOrNull = (value: unknown): number | null => {
    if (value === null || value === undefined) {
        return null;
    }

    const trimmed = String(value).trim();

    if (!trimmed) {
        return null;
    }

    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
};

const hasFilledValue = (value: unknown): boolean => {
    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value === 'number') {
        return true;
    }

    return String(value).trim() !== '';
};

const jenisSimpananSchema = z
    .object({
        nama: z
            .string()
            .trim()
            .min(1, 'Nama harus diisi')
            .max(255, 'Nama maksimal 255 karakter'),
        kode: z
            .string()
            .trim()
            .min(1, 'Kode harus diisi')
            .max(255, 'Kode maksimal 255 karakter'),
        terkunci: z.boolean(),
        jumlah_minimal: z.union([z.string(), z.number(), z.null()]),
        jumlah_maksimal: z.union([z.string(), z.number(), z.null()]),
    })
    .superRefine((data, ctx) => {
        const jumlahMinimal = toNumberOrNull(data.jumlah_minimal);
        const jumlahMaksimal = toNumberOrNull(data.jumlah_maksimal);
        const hasJumlahMinimal = hasFilledValue(data.jumlah_minimal);
        const hasJumlahMaksimal = hasFilledValue(data.jumlah_maksimal);

        if (hasJumlahMinimal && jumlahMinimal === null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['jumlah_minimal'],
                message: 'Jumlah minimal harus berupa angka',
            });
        }

        if (hasJumlahMaksimal && jumlahMaksimal === null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['jumlah_maksimal'],
                message: 'Jumlah maksimal harus berupa angka',
            });
        }

        if (jumlahMinimal !== null && jumlahMinimal < 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['jumlah_minimal'],
                message: 'Jumlah minimal harus bernilai positif',
            });
        }

        if (jumlahMaksimal !== null && jumlahMaksimal < 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['jumlah_maksimal'],
                message: 'Jumlah maksimal harus bernilai positif',
            });
        }

        if (
            jumlahMinimal !== null &&
            jumlahMaksimal !== null &&
            jumlahMaksimal < jumlahMinimal
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['jumlah_maksimal'],
                message:
                    'Jumlah maksimal tidak boleh lebih kecil dari jumlah minimal',
            });
        }
    });

export const createJenisSimpananSchema = jenisSimpananSchema;

export const updateJenisSimpananSchema = jenisSimpananSchema;

export const buildPayload = (data: JenisSimpananForm) => ({
    nama: data.nama.trim(),
    kode: data.kode.trim().toUpperCase(),
    terkunci: data.terkunci,
    jumlah_minimal: toNumberOrNull(data.jumlah_minimal),
    jumlah_maksimal: toNumberOrNull(data.jumlah_maksimal),
});

export const getFirstValidationError = (error: z.ZodError) =>
    error.issues[0]?.message ?? 'Data tidak valid';

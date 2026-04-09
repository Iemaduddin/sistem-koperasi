import { z } from 'zod';
import type { RekeningKoperasiForm } from './types';

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

const rekeningKoperasiSchema = z
    .object({
        nama: z
            .string()
            .trim()
            .min(1, 'Nama harus diisi')
            .max(255, 'Nama maksimal 255 karakter'),
        jenis: z
            .string()
            .trim()
            .min(1, 'Jenis harus dipilih')
            .refine((value) => value === 'tunai' || value === 'bank', {
                message: 'Jenis harus dipilih',
            }),
        nomor_rekening: z
            .string()
            .trim()
            .min(1, 'Nomor rekening harus diisi')
            .max(255, 'Nomor rekening maksimal 255 karakter'),
        saldo: z.union([z.string(), z.number(), z.null()]),
    })
    .superRefine((data, ctx) => {
        const saldo = toNumberOrNull(data.saldo);
        const hasSaldo = hasFilledValue(data.saldo);

        if (!hasSaldo) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['saldo'],
                message: 'Saldo harus diisi',
            });

            return;
        }

        if (saldo === null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['saldo'],
                message: 'Saldo harus berupa angka',
            });

            return;
        }

        if (saldo < 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['saldo'],
                message: 'Saldo harus bernilai positif',
            });
        }
    });

export const createRekeningKoperasiSchema = rekeningKoperasiSchema;

export const updateRekeningKoperasiSchema = rekeningKoperasiSchema;

export const buildPayload = (data: RekeningKoperasiForm) => ({
    nama: data.nama.trim(),
    jenis: data.jenis,
    nomor_rekening: data.nomor_rekening.trim(),
    saldo: toNumberOrNull(data.saldo),
});

export const getFirstValidationError = (error: z.ZodError) =>
    error.issues[0]?.message ?? 'Data tidak valid';

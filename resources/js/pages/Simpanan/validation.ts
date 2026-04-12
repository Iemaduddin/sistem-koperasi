import { z } from 'zod';
import type { SimpananForm } from './types';

const jenisTransaksiSchema = z.enum(['setor']);

export function normalizeNumber(value: string): number | null {
    const digits = value.replace(/\D/g, '');

    if (!digits) {
        return null;
    }

    const parsed = Number(digits);

    return Number.isNaN(parsed) ? null : parsed;
}

const simpananSchema = z.object({
    rekening_koperasi_id: z
        .string()
        .trim()
        .min(1, 'Rekening koperasi wajib dipilih'),
    anggota_id: z.string().trim().min(1, 'Anggota wajib dipilih'),
    jenis_transaksi: jenisTransaksiSchema,
    simpanan_pokok_jumlah: z
        .number()
        .positive('Simpanan pokok harus lebih dari 0')
        .optional(),
    simpanan_pokok_keterangan: z
        .string()
        .max(1000, 'Keterangan simpanan pokok maksimal 1000 karakter'),
    simpanan_wajib_jumlah: z
        .number()
        .positive('Simpanan wajib harus lebih dari 0')
        .optional(),
    simpanan_wajib_keterangan: z
        .string()
        .max(1000, 'Keterangan simpanan wajib maksimal 1000 karakter'),
    simpanan_sukarela_jumlah: z.number().positive().optional(),
    simpanan_sukarela_keterangan: z
        .string()
        .max(1000, 'Keterangan simpanan sukarela maksimal 1000 karakter'),
    alihkan_sisa_wajib_ke_sukarela: z.boolean(),
    created_at: z
        .string()
        .refine((value) => !Number.isNaN(new Date(value).getTime()), {
            message: 'Tanggal transaksi wajib diisi',
        }),
});

export type SimpananPayload = z.infer<typeof simpananSchema>;

export function buildPayload(
    data: SimpananForm,
    alihkanSisaWajibKeSukarela = false,
): SimpananPayload {
    return {
        rekening_koperasi_id: data.rekening_koperasi_id,
        anggota_id: data.anggota_id,
        jenis_transaksi: 'setor',
        simpanan_pokok_jumlah:
            normalizeNumber(data.simpanan_pokok_jumlah) ?? undefined,
        simpanan_pokok_keterangan: data.simpanan_pokok_keterangan.trim(),
        simpanan_wajib_jumlah:
            normalizeNumber(data.simpanan_wajib_jumlah) ?? undefined,
        simpanan_wajib_keterangan: data.simpanan_wajib_keterangan.trim(),
        simpanan_sukarela_jumlah:
            normalizeNumber(data.simpanan_sukarela_jumlah) ?? undefined,
        simpanan_sukarela_keterangan: data.simpanan_sukarela_keterangan.trim(),
        alihkan_sisa_wajib_ke_sukarela: alihkanSisaWajibKeSukarela,
        created_at: data.created_at,
    };
}

export function validatePayload(payload: SimpananPayload) {
    return simpananSchema.safeParse(payload);
}

export function getFirstValidationError(error: z.ZodError): string {
    return error.issues[0]?.message ?? 'Data transaksi simpanan tidak valid';
}

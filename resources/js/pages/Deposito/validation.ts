import { z } from 'zod';
import {
    addMonths,
    getPersenBagiHasil,
    normalizeDateOnly,
    type DepositoForm,
    type LogBagiHasilRow,
} from './types';

const tenorSchema = z.enum(['6', '12']);

const depositoSchema = z.object({
    rekening_koperasi_id: z
        .string()
        .trim()
        .min(1, 'Rekening koperasi wajib dipilih'),
    anggota_id: z.string().trim().min(1, 'Anggota wajib dipilih'),
    saldo: z.number().positive('Saldo deposito harus lebih dari 0'),
    tenor_bulan: z.union([z.literal(6), z.literal(12)]),
    persen_bagi_hasil: z.number().positive('Persen bagi hasil harus valid'),
    tanggal_mulai: z
        .string()
        .refine((value) => normalizeDateOnly(value) !== '', {
            message: 'Tanggal mulai wajib diisi',
        }),
    tanggal_selesai: z
        .string()
        .refine((value) => normalizeDateOnly(value) !== '', {
            message: 'Tanggal selesai wajib diisi',
        }),
    log_bagi_hasil: z.array(
        z.object({
            tanggal_perhitungan: z.string(),
            nominal_bagi_hasil: z.number().nonnegative(),
        }),
    ),
});

export type DepositoPayload = z.infer<typeof depositoSchema>;

export function normalizeNumber(value: string): number | null {
    const digits = value.replace(/\D/g, '');

    if (!digits) {
        return null;
    }

    const parsed = Number(digits);

    return Number.isNaN(parsed) ? null : parsed;
}

export function resolveTenor(value: string): '6' | '12' {
    return tenorSchema.safeParse(value).success && value === '12' ? '12' : '6';
}

export function buildPreviewLogs(
    tanggalMulai: string,
    tenorBulan: number,
    nominalBulanan: number,
): LogBagiHasilRow[] {
    const tanggalMulaiNormalized = normalizeDateOnly(tanggalMulai);

    if (!tanggalMulaiNormalized || tenorBulan <= 0 || nominalBulanan < 0) {
        return [];
    }

    return Array.from({ length: tenorBulan }, (_, index) => ({
        tanggal_perhitungan: addMonths(tanggalMulaiNormalized, index + 1),
        nominal_bagi_hasil: nominalBulanan,
    }));
}

export function buildPayload(
    data: DepositoForm,
    previewLogs: LogBagiHasilRow[],
): DepositoPayload {
    const tenorBulan = Number(data.tenor_bulan) === 12 ? 12 : 6;
    const persenBagiHasil = getPersenBagiHasil(data.tenor_bulan);
    const saldo = normalizeNumber(data.saldo) ?? 0;
    const tanggalMulai = normalizeDateOnly(data.tanggal_mulai);
    const tanggalSelesai = addMonths(tanggalMulai, tenorBulan);

    return {
        rekening_koperasi_id: data.rekening_koperasi_id,
        anggota_id: data.anggota_id,
        saldo,
        tenor_bulan: tenorBulan,
        persen_bagi_hasil: persenBagiHasil,
        tanggal_mulai: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
        log_bagi_hasil: previewLogs.map((log) => ({
            tanggal_perhitungan: normalizeDateOnly(log.tanggal_perhitungan),
            nominal_bagi_hasil: Number(log.nominal_bagi_hasil) || 0,
        })),
    };
}

export function validatePayload(payload: DepositoPayload) {
    return depositoSchema.safeParse(payload);
}

export function getFirstValidationError(error: z.ZodError): string {
    return error.issues[0]?.message ?? 'Data deposito tidak valid';
}

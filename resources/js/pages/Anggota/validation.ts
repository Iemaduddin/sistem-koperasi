import { z } from 'zod';
import type { AnggotaForm } from './types';

const nomorHpRegex = /^08\d{8,13}$/;
const toEmptyStringWhenNil = (value: unknown) =>
    value === undefined || value === null ? '' : value;

const optionalTrimmedString = z.preprocess(
    toEmptyStringWhenNil,
    z.string().trim(),
);

const anggotaSchema = z
    .object({
        no_anggota: z
            .string()
            .trim()
            .min(1, 'No. Anggota harus diisi')
            .max(255, 'No. Anggota maksimal 255 karakter'),
        nik: z.preprocess(
            toEmptyStringWhenNil,
            z
                .string()
                .trim()
                .refine(
                    (value) => value === '' || /^[0-9]{16}$/.test(value),
                    'NIK harus terdiri dari 16 angka',
                ),
        ),
        nama: z
            .string()
            .trim()
            .min(1, 'Nama harus diisi')
            .max(255, 'Nama maksimal 255 karakter'),
        alamat: z.preprocess(toEmptyStringWhenNil, z.string().trim()),
        no_hp: z.preprocess(
            toEmptyStringWhenNil,
            z
                .string()
                .trim()
                .max(255, 'No. HP maksimal 255 karakter')
                .refine(
                    (value) => value === '' || nomorHpRegex.test(value),
                    'Format No. HP tidak valid. Gunakan angka dan awali 08.',
                ),
        ),
        no_hp_cadangan: z.preprocess(
            toEmptyStringWhenNil,
            z
                .string()
                .trim()
                .max(255, 'No. HP cadangan maksimal 255 karakter')
                .refine(
                    (value) => value === '' || nomorHpRegex.test(value),
                    'Format No. HP cadangan tidak valid. Gunakan angka dan awali 08.',
                ),
        ),
        status: z.enum(['aktif', 'nonaktif', 'keluar']),
        tanggal_bergabung: z
            .string()
            .trim()
            .min(1, 'Tanggal bergabung harus diisi'),
        tanggal_keluar: optionalTrimmedString,
    })
    .superRefine((data, ctx) => {
        if (data.status === 'keluar' && !data.tanggal_keluar) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['tanggal_keluar'],
                message: 'Tanggal keluar wajib diisi jika status keluar',
            });
        }

        if (data.tanggal_keluar && data.tanggal_bergabung) {
            const joined = new Date(data.tanggal_bergabung);
            const exited = new Date(data.tanggal_keluar);

            if (exited < joined) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['tanggal_keluar'],
                    message:
                        'Tanggal keluar tidak boleh sebelum tanggal bergabung',
                });
            }
        }
    });

export const createAnggotaSchema = anggotaSchema;

export const updateAnggotaSchema = anggotaSchema;

export const buildPayload = (data: AnggotaForm): AnggotaForm => ({
    ...data,
    no_anggota: data.no_anggota.trim(),
    nik: (data.nik ?? '').trim(),
    nama: data.nama.trim(),
    alamat: (data.alamat ?? '').trim(),
    no_hp: (data.no_hp ?? '').trim(),
    no_hp_cadangan: data.no_hp_cadangan.trim(),
    tanggal_bergabung: data.tanggal_bergabung.trim(),
});

export const getFirstValidationError = (error: z.ZodError) =>
    error.issues[0]?.message ?? 'Data tidak valid';

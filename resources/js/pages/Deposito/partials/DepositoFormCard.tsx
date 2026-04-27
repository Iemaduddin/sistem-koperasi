import type { FormEvent } from 'react';
import Button from '@/components/button';
import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import type { DepositoForm } from '../types';

type Props = {
    formData: DepositoForm;
    isSubmitting: boolean;
    isBlockedBySimpananRequirement: boolean;
    requirementHintText: string;
    rekeningKoperasiOptions: Array<{ value: string; label: string }>;
    anggotaOptions: Array<{ value: string; label: string }>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onChangeField: <K extends keyof DepositoForm>(
        field: K,
        value: DepositoForm[K],
    ) => void;
};

export default function DepositoFormCard({
    formData,
    isSubmitting,
    isBlockedBySimpananRequirement,
    requirementHintText,
    rekeningKoperasiOptions,
    anggotaOptions,
    onSubmit,
    onChangeField,
}: Props) {
    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold text-slate-900">
                Tambah Simpanan Deposito
            </h2>
            <p className="mt-1 text-sm text-slate-600">
                Alur: pilih rekening koperasi, pilih anggota, isi saldo, pilih
                tenor, lalu sistem menghitung bagi hasil per bulan dan total
                bagi hasil hingga selesai tenor.
            </p>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <FloatingSelect
                        label="Rekening Koperasi"
                        value={formData.rekening_koperasi_id}
                        options={rekeningKoperasiOptions}
                        onValueChange={(value) =>
                            onChangeField('rekening_koperasi_id', value)
                        }
                        searchable
                        disabled={isBlockedBySimpananRequirement}
                        required
                    />

                    <div className="col-span-1 md:col-span-3">
                        <FloatingSelect
                            label="Anggota"
                            value={formData.anggota_id}
                            options={anggotaOptions}
                            onValueChange={(value) =>
                                onChangeField('anggota_id', value)
                            }
                            searchable
                            helperText={
                                isBlockedBySimpananRequirement
                                    ? 'Anggota dapat diganti, namun transaksi deposito dikunci sampai simpanan pokok/wajib terpenuhi.'
                                    : undefined
                            }
                            required
                        />
                    </div>

                    <FloatingInput
                        label="Saldo Deposito"
                        type="rupiah"
                        value={formData.saldo}
                        onCurrencyValueChange={(value) =>
                            onChangeField('saldo', value.raw)
                        }
                        disabled={isBlockedBySimpananRequirement}
                        required
                    />

                    <FloatingSelect
                        label="Tenor"
                        value={formData.tenor_bulan}
                        searchable={false}
                        options={[
                            {
                                value: '6',
                                label: '6 bulan (0,6% per bulan)',
                            },
                            {
                                value: '12',
                                label: '12 bulan (0,8% per bulan)',
                            },
                        ]}
                        onValueChange={(value) =>
                            onChangeField(
                                'tenor_bulan',
                                value === '12' ? '12' : '6',
                            )
                        }
                        disabled={isBlockedBySimpananRequirement}
                        required
                    />
                    <FloatingInput
                        label="Tanggal Mulai"
                        type="date"
                        value={formData.tanggal_mulai}
                        onChange={(event) =>
                            onChangeField('tanggal_mulai', event.target.value)
                        }
                        disabled={isBlockedBySimpananRequirement}
                        required
                    />

                    <FloatingInput
                        label="Tanggal Selesai"
                        type="date"
                        value={formData.tanggal_selesai}
                        readOnly
                        disabled={isBlockedBySimpananRequirement}
                        helperText={
                            isBlockedBySimpananRequirement
                                ? requirementHintText
                                : undefined
                        }
                        required
                    />
                </div>

                <div>
                    <Button
                        type="submit"
                        loading={isSubmitting}
                        disabled={
                            isSubmitting || isBlockedBySimpananRequirement
                        }
                    >
                        Simpan Deposito
                    </Button>
                </div>
            </form>
        </article>
    );
}

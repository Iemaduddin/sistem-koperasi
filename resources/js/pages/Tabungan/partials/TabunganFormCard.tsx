import type { FormEvent } from 'react';
import Button from '@/components/button';
import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';

type TabunganForm = {
    rekening_koperasi_id: string;
    anggota_id: string;
    jumlah: string;
    keterangan: string;
    created_at: string;
};

type Props = {
    formData: TabunganForm;
    isSubmitting: boolean;
    isLoadingOptions?: boolean;
    isRekeningMinus?: boolean;
    rekeningKoperasiOptions: Array<{ value: string; label: string }>;
    anggotaOptions: Array<{ value: string; label: string }>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onChangeField: <K extends keyof TabunganForm>(
        field: K,
        value: TabunganForm[K],
    ) => void;
    onReset: () => void;
};

export default function TabunganFormCard({
    formData,
    isSubmitting,
    isLoadingOptions,
    isRekeningMinus = false,
    rekeningKoperasiOptions,
    anggotaOptions,
    onSubmit,
    onChangeField,
    onReset,
}: Props) {
    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">
                Form Tabungan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
                Tambahkan transaksi tabungan untuk anggota koperasi.
            </p>

            <form
                onSubmit={onSubmit}
                className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3"
            >
                <FloatingSelect
                    label="Anggota"
                    value={formData.anggota_id}
                    options={anggotaOptions}
                    onValueChange={(value) =>
                        onChangeField('anggota_id', value)
                    }
                    searchable
                    disabled={isSubmitting || isLoadingOptions}
                    required
                />

                <FloatingSelect
                    label="Rekening Koperasi"
                    value={formData.rekening_koperasi_id}
                    options={rekeningKoperasiOptions}
                    onValueChange={(value) =>
                        onChangeField('rekening_koperasi_id', value)
                    }
                    searchable
                    disabled={isSubmitting || isRekeningMinus}
                    required
                />

                <FloatingInput
                    label="Jumlah Setoran Tabungan"
                    type="rupiah"
                    value={formData.jumlah}
                    disabled={isSubmitting || isRekeningMinus}
                    onCurrencyValueChange={(value) => {
                        onChangeField(
                            'jumlah',
                            String(Math.max(0, Math.floor(value.numeric ?? 0))),
                        );
                    }}
                    required
                />

                <FloatingInput
                    label="Tanggal Transaksi"
                    type="datetime-local"
                    value={formData.created_at}
                    disabled={isSubmitting || isRekeningMinus}
                    onChange={(event) =>
                        onChangeField('created_at', event.target.value)
                    }
                    required
                />

                <div className="md:col-span-2">
                    <FloatingInput
                        label="Keterangan (Opsional)"
                        value={formData.keterangan}
                        disabled={isSubmitting || isRekeningMinus}
                        onChange={(event) =>
                            onChangeField('keterangan', event.target.value)
                        }
                    />
                </div>

                {isRekeningMinus && (
                    <p className="text-xs text-red-600 sm:col-span-2">
                        Rekening koperasi yang dipilih bersaldo minus. Form
                        dinonaktifkan.
                    </p>
                )}

                <div className="flex gap-2 sm:col-span-2">
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isSubmitting}
                        disabled={
                            isSubmitting || isLoadingOptions || isRekeningMinus
                        }
                    >
                        Simpan Tabungan
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onReset}
                        disabled={isSubmitting}
                    >
                        Reset
                    </Button>
                </div>
            </form>
        </article>
    );
}

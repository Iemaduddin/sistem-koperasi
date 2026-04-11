import type { FormEvent } from 'react';
import Button from '@/components/button';
import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import type { SimpananForm } from '../types';

type Props = {
    formData: SimpananForm;
    isSubmitting: boolean;
    isPokokLocked: boolean;
    pokokInfoText: string;
    isWajibLocked: boolean;
    wajibInfoText: string;
    rekeningKoperasiOptions: Array<{ value: string; label: string }>;
    anggotaOptions: Array<{ value: string; label: string }>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onChangeField: <K extends keyof SimpananForm>(
        field: K,
        value: SimpananForm[K],
    ) => void;
};

export default function SimpananFormCard({
    formData,
    isSubmitting,
    isPokokLocked,
    pokokInfoText,
    isWajibLocked,
    wajibInfoText,
    rekeningKoperasiOptions,
    anggotaOptions,
    onSubmit,
    onChangeField,
}: Props) {
    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold text-slate-900">
                Tambah Transaksi Simpanan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
                Alur: pilih rekening koperasi, pilih anggota, lalu isi nominal
                setoran per jenis simpanan.
            </p>

            <form onSubmit={onSubmit} className="mt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <FloatingSelect
                        label="Rekening Koperasi"
                        value={formData.rekening_koperasi_id}
                        options={rekeningKoperasiOptions}
                        onValueChange={(value) =>
                            onChangeField('rekening_koperasi_id', value)
                        }
                        searchable
                        required
                    />

                    <div className="col-span-1 md:col-span-2">
                        <FloatingSelect
                            label="Anggota"
                            value={formData.anggota_id}
                            options={anggotaOptions}
                            onValueChange={(value) =>
                                onChangeField('anggota_id', value)
                            }
                            searchable
                            required
                        />
                    </div>

                    <FloatingInput
                        label="Tanggal Transaksi"
                        type="datetime-local"
                        value={formData.created_at}
                        onChange={(event) =>
                            onChangeField('created_at', event.target.value)
                        }
                        required
                    />
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <h3 className="text-sm font-semibold text-slate-800">
                        Detail Setoran Simpanan
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                        Kolom disusun per baris: jenis simpanan, jumlah setoran,
                        dan keterangan. Jika simpanan wajib penuh, sistem akan
                        meminta konfirmasi pengalihan sisa ke simpanan sukarela.
                    </p>

                    <div className="mt-3 hidden grid-cols-12 gap-3 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase lg:grid">
                        <div className="col-span-3">Jenis Simpanan</div>
                        <div className="col-span-4">Jumlah Setoran</div>
                        <div className="col-span-5">Keterangan</div>
                    </div>

                    <div className="mt-2 space-y-3">
                        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:grid-cols-12">
                            <div className="lg:col-span-3">
                                <p className="text-sm font-medium text-slate-800">
                                    Simpanan Pokok
                                </p>
                                <p
                                    className={`text-xs ${isPokokLocked ? 'text-emerald-600' : 'text-rose-600'}`}
                                >
                                    {isPokokLocked
                                        ? 'Sudah dibayar'
                                        : 'Wajib saat pembayaran pertama'}
                                </p>
                            </div>
                            <div className="lg:col-span-4">
                                <FloatingInput
                                    label="Jumlah Setoran"
                                    type="rupiah"
                                    value={formData.simpanan_pokok_jumlah}
                                    onCurrencyValueChange={(value) =>
                                        onChangeField(
                                            'simpanan_pokok_jumlah',
                                            value.raw,
                                        )
                                    }
                                    disabled={isPokokLocked}
                                    required={!isPokokLocked}
                                    placeholder={
                                        isPokokLocked
                                            ? 'Simpanan pokok sudah terpenuhi'
                                            : 'Wajib untuk pembayaran pertama'
                                    }
                                />
                            </div>
                            <div className="lg:col-span-5">
                                <FloatingInput
                                    label="Keterangan (Opsional)"
                                    value={formData.simpanan_pokok_keterangan}
                                    onChange={(event) =>
                                        onChangeField(
                                            'simpanan_pokok_keterangan',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Opsional"
                                    disabled={isPokokLocked}
                                />
                            </div>
                            {pokokInfoText ? (
                                <div className="lg:col-span-12">
                                    <p className="text-xs text-slate-600">
                                        {pokokInfoText}
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:grid-cols-12">
                            <div className="lg:col-span-3">
                                <p className="text-sm font-medium text-slate-800">
                                    Simpanan Wajib
                                </p>
                                <p
                                    className={`text-xs ${isWajibLocked ? 'text-emerald-600' : 'text-rose-600'}`}
                                >
                                    {isWajibLocked
                                        ? 'Sudah penuh'
                                        : 'Wajib sampai batas maksimal'}
                                </p>
                            </div>
                            <div className="lg:col-span-4">
                                <FloatingInput
                                    label="Jumlah Setoran"
                                    type="rupiah"
                                    value={formData.simpanan_wajib_jumlah}
                                    onCurrencyValueChange={(value) =>
                                        onChangeField(
                                            'simpanan_wajib_jumlah',
                                            value.raw,
                                        )
                                    }
                                    disabled={isWajibLocked}
                                    required={!isWajibLocked}
                                    placeholder={
                                        isWajibLocked
                                            ? 'Simpanan wajib sudah penuh'
                                            : 'Wajib diisi'
                                    }
                                />
                            </div>
                            <div className="lg:col-span-5">
                                <FloatingInput
                                    label="Keterangan (Opsional)"
                                    value={formData.simpanan_wajib_keterangan}
                                    onChange={(event) =>
                                        onChangeField(
                                            'simpanan_wajib_keterangan',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Opsional"
                                    disabled={isWajibLocked}
                                />
                            </div>
                            {wajibInfoText ? (
                                <div className="lg:col-span-12">
                                    <p className="text-xs text-slate-600">
                                        {wajibInfoText}
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:grid-cols-12">
                            <div className="lg:col-span-3">
                                <p className="text-sm font-medium text-slate-800">
                                    Simpanan Sukarela
                                </p>
                                <p className="text-xs text-slate-500">
                                    Opsional
                                </p>
                            </div>
                            <div className="lg:col-span-4">
                                <FloatingInput
                                    label="Jumlah Setoran"
                                    type="rupiah"
                                    value={formData.simpanan_sukarela_jumlah}
                                    onCurrencyValueChange={(value) =>
                                        onChangeField(
                                            'simpanan_sukarela_jumlah',
                                            value.raw,
                                        )
                                    }
                                    placeholder="Opsional"
                                />
                            </div>
                            <div className="lg:col-span-5">
                                <FloatingInput
                                    label="Keterangan (Opsional)"
                                    value={
                                        formData.simpanan_sukarela_keterangan
                                    }
                                    onChange={(event) =>
                                        onChangeField(
                                            'simpanan_sukarela_keterangan',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Opsional"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <Button
                        type="submit"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        Simpan Transaksi Simpanan
                    </Button>
                </div>
            </form>
        </article>
    );
}

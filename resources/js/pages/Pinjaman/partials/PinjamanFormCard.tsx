import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import Button from '@/components/button';
import type { PinjamanForm } from '../types';

const BAGI_HASIL_OPTIONS = [
    { value: '25', label: '25%' },
    { value: '30', label: '30%' },
    { value: '35', label: '35%' },
];

const TENOR_OPTIONS = [
    { value: '6', label: '6 Bulan' },
    { value: '10', label: '10 Bulan' },
    { value: '12', label: '12 Bulan' },
];

type SelectOption = { value: string; label: string };

type Props = {
    formData: PinjamanForm;
    anggotaOptions: SelectOption[];
    rekeningOptions: SelectOption[];
    isSubmitting: boolean;
    onChangeField: <K extends keyof PinjamanForm>(field: K, value: PinjamanForm[K]) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export default function PinjamanFormCard({
    formData,
    anggotaOptions,
    rekeningOptions,
    isSubmitting,
    onChangeField,
    onSubmit,
}: Props) {
    // Kalkulasi preview angsuran per bulan
    const jumlah = Number(formData.jumlah_pinjaman) || 0;
    const bunga = Number(formData.bunga_persen) || 0;
    const tenor = Number(formData.tenor_bulan) || 1;
    const bungaTotal = (jumlah * bunga) / 100;
    const bungaPerBulan = bungaTotal / 10;
    const pokokPerBulan = jumlah / tenor;
    const angsuranPerBulan = (jumlah + (bungaPerBulan * tenor)) / tenor;

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-neutral-800">
                Tambah Pinjaman Baru
            </h2>

            <form onSubmit={onSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FloatingSelect
                        label="Anggota"
                        value={formData.anggota_id}
                        options={anggotaOptions}
                        onValueChange={(value) => onChangeField('anggota_id', value)}
                        searchable
                        required
                    />

                    <FloatingInput
                        label="Jumlah Pinjaman"
                        type="rupiah"
                        value={formData.jumlah_pinjaman}
                        onCurrencyValueChange={(value) =>
                            onChangeField(
                                'jumlah_pinjaman',
                                String(Math.max(0, Math.floor(value.numeric ?? 0))),
                            )
                        }
                        required
                    />

                    <FloatingSelect
                        label="Rekening Koperasi"
                        value={formData.rekening_koperasi_id}
                        options={rekeningOptions}
                        onValueChange={(value) => onChangeField('rekening_koperasi_id', value)}
                        required
                    />

                    <FloatingSelect
                        label="Bagi Hasil"
                        value={formData.bunga_persen}
                        options={BAGI_HASIL_OPTIONS}
                        onValueChange={(value) => onChangeField('bunga_persen', value)}
                        required
                    />

                    <FloatingSelect
                        label="Tenor (bulan)"
                        value={formData.tenor_bulan}
                        options={TENOR_OPTIONS}
                        onValueChange={(value) => onChangeField('tenor_bulan', value)}
                        required
                    />

                    <FloatingInput
                        label="Tanggal Mulai"
                        type="date"
                        value={formData.tanggal_mulai}
                        onChange={(e) => onChangeField('tanggal_mulai', e.target.value)}
                        required
                    />
                </div>

                {/* Preview kalkulasi */}
                {jumlah > 0 && tenor > 0 && (
                    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        <p className="font-medium">Estimasi Angsuran</p>
                        <p className="mt-1">
                            Pokok:{' '}
                            <span className="font-semibold">
                                Rp {Math.round(pokokPerBulan).toLocaleString('id-ID')}
                            </span>
                            {' '}+ Bagi Hasil:{' '}
                            <span className="font-semibold">
                                Rp {Math.round(bungaPerBulan).toLocaleString('id-ID')}
                            </span>
                            {' '}={' '}
                            <span className="font-bold text-blue-900">
                                Rp {Math.round(angsuranPerBulan).toLocaleString('id-ID')} / bulan
                            </span>
                        </p>
                    </div>
                )}

                <div className="mt-5 flex justify-end">
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        Simpan Pinjaman
                    </Button>
                </div>
            </form>
        </div>
    );
}

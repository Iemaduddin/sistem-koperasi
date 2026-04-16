import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import Button from '@/components/button';
import type { PinjamanForm } from '../types';

type SelectOption = { value: string; label: string };

type Props = {
    formData: PinjamanForm;
    anggotaOptions: SelectOption[];
    isSubmitting: boolean;
    onChangeField: <K extends keyof PinjamanForm>(field: K, value: PinjamanForm[K]) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export default function PinjamanFormCard({
    formData,
    anggotaOptions,
    isSubmitting,
    onChangeField,
    onSubmit,
}: Props) {
    // Kalkulasi preview angsuran per bulan
    const jumlah = Number(formData.jumlah_pinjaman) || 0;
    const bunga = Number(formData.bunga_persen) || 0;
    const tenor = Number(formData.tenor_bulan) || 1;
    const bungaPerBulan = (jumlah * bunga) / 100;
    const pokokPerBulan = jumlah / tenor;
    const angsuranPerBulan = pokokPerBulan + bungaPerBulan;

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-neutral-800">
                Tambah Pinjaman Baru
            </h2>

            <form onSubmit={onSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="sm:col-span-2 lg:col-span-3">
                        <FloatingSelect
                            label="Anggota"
                            value={formData.anggota_id}
                            options={anggotaOptions}
                            onValueChange={(value) => onChangeField('anggota_id', value)}
                            searchable
                            required
                        />
                    </div>

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

                    <FloatingInput
                        label="Bunga per Bulan (%)"
                        type="number"
                        value={formData.bunga_persen}
                        onChange={(e) => onChangeField('bunga_persen', e.target.value)}
                        min={0}
                        max={100}
                        step={0.01}
                        required
                    />

                    <FloatingInput
                        label="Tenor (bulan)"
                        type="number"
                        value={formData.tenor_bulan}
                        onChange={(e) => onChangeField('tenor_bulan', e.target.value)}
                        min={1}
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
                            {' '}+ Bunga:{' '}
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

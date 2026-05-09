import type { FormEvent } from 'react';
import Button from '@/components/button';
import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import type { RekeningKoperasiForm, RekeningKoperasiRow } from '../types';

type InputField = keyof RekeningKoperasiForm;

type ErrorBag = Partial<Record<InputField, string>>;

type Props = {
    editingRekeningKoperasi: RekeningKoperasiRow | null;
    createData: RekeningKoperasiForm;
    updateData: RekeningKoperasiForm;
    createErrors: ErrorBag;
    updateErrors: ErrorBag;
    createProcessing: boolean;
    updateProcessing: boolean;
    isSubmitting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onPrimaryAction: () => void;
    onCancelEdit: () => void;
    onChangeField: (field: InputField, value: string) => void;
};

export default function RekeningKoperasiFormCard({
    editingRekeningKoperasi,
    createData,
    updateData,
    createErrors,
    updateErrors,
    createProcessing,
    updateProcessing,
    isSubmitting,
    onSubmit,
    onPrimaryAction,
    onCancelEdit,
    onChangeField,
}: Props) {
    const formData = editingRekeningKoperasi ? updateData : createData;
    const errors = editingRekeningKoperasi ? updateErrors : createErrors;
    const isProcessing = editingRekeningKoperasi
        ? updateProcessing
        : createProcessing;
    const isEditMode = editingRekeningKoperasi !== null;

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">
                {editingRekeningKoperasi
                    ? `Edit Rekening Koperasi: ${editingRekeningKoperasi.nama}`
                    : 'Tambah Rekening Koperasi Baru'}
            </h3>

            <form onSubmit={onSubmit} className="mt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FloatingInput
                        label="Nama Rekening Koperasi"
                        value={formData.nama}
                        onChange={(event) =>
                            onChangeField('nama', event.target.value)
                        }
                        errorText={errors.nama}
                        required
                    />

                    <FloatingInput
                        label="Nomor Rekening"
                        value={formData.nomor_rekening}
                        onChange={(event) =>
                            onChangeField('nomor_rekening', event.target.value)
                        }
                        errorText={errors.nomor_rekening}
                        required
                    />

                    <FloatingSelect
                        label="Jenis"
                        value={formData.jenis}
                        options={[
                            { value: 'bank', label: 'Bank' },
                            { value: 'tunai', label: 'Tunai' },
                        ]}
                        onValueChange={(value) => onChangeField('jenis', value)}
                        searchable={false}
                        disabled={isEditMode}
                    />

                    <FloatingInput
                        label="Saldo"
                        value={formData.saldo}
                        type="rupiah"
                        onCurrencyValueChange={(value) =>
                            onChangeField('saldo', value.raw)
                        }
                        errorText={errors.saldo}
                        placeholder="Contoh: 50000"
                        required
                        disabled={isEditMode}
                    />
                </div>

                {isEditMode ? (
                    <p className="mt-3 text-xs text-slate-500">
                        Jenis dan saldo merupakan master data, tidak dapat
                        diubah saat edit.
                    </p>
                ) : null}

                <div className="mt-4 flex gap-2">
                    <Button
                        type="button"
                        disabled={isSubmitting || isProcessing}
                        loading={isSubmitting || isProcessing}
                        onClick={onPrimaryAction}
                    >
                        {editingRekeningKoperasi
                            ? 'Update Rekening Koperasi'
                            : 'Simpan Rekening Koperasi'}
                    </Button>
                    {editingRekeningKoperasi && (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={updateProcessing}
                            onClick={onCancelEdit}
                        >
                            Batal
                        </Button>
                    )}
                </div>
            </form>
        </article>
    );
}

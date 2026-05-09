import type { FormEvent } from 'react';
import Button from '@/components/button';
import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import type { JenisSimpananForm, JenisSimpananRow } from '../types';

type InputField = keyof JenisSimpananForm;

type ErrorBag = Partial<Record<InputField, string>>;

type Props = {
    editingJenisSimpanan: JenisSimpananRow | null;
    createData: JenisSimpananForm;
    updateData: JenisSimpananForm;
    createErrors: ErrorBag;
    updateErrors: ErrorBag;
    createProcessing: boolean;
    updateProcessing: boolean;
    isSubmitting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onPrimaryAction: () => void;
    onCancelEdit: () => void;
    onChangeField: (field: InputField, value: string | boolean) => void;
};

export default function JenisSimpananFormCard({
    editingJenisSimpanan,
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
    const formData = editingJenisSimpanan ? updateData : createData;
    const errors = editingJenisSimpanan ? updateErrors : createErrors;
    const isProcessing = editingJenisSimpanan
        ? updateProcessing
        : createProcessing;

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">
                {editingJenisSimpanan
                    ? `Edit Jenis Simpanan: ${editingJenisSimpanan.nama}`
                    : 'Tambah Jenis Simpanan Baru'}
            </h3>

            <form onSubmit={onSubmit} className="mt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FloatingInput
                        label="Nama"
                        value={formData.nama}
                        onChange={(event) =>
                            onChangeField('nama', event.target.value)
                        }
                        errorText={errors.nama}
                        required
                    />

                    <FloatingInput
                        label="Kode"
                        value={formData.kode}
                        onChange={(event) =>
                            onChangeField('kode', event.target.value)
                        }
                        errorText={errors.kode}
                        required
                    />

                    <FloatingInput
                        label="Jumlah Minimal"
                        value={formData.jumlah_minimal}
                        type="rupiah"
                        onCurrencyValueChange={(value) =>
                            onChangeField('jumlah_minimal', value.raw)
                        }
                        errorText={errors.jumlah_minimal}
                        placeholder="Contoh: 50000"
                    />

                    <FloatingInput
                        label="Jumlah Maksimal"
                        value={formData.jumlah_maksimal}
                        type="rupiah"
                        onCurrencyValueChange={(value) =>
                            onChangeField('jumlah_maksimal', value.raw)
                        }
                        errorText={errors.jumlah_maksimal}
                        placeholder="Contoh: 1000000"
                    />

                    <FloatingSelect
                        label="Status Kunci"
                        value={formData.terkunci ? '1' : '0'}
                        options={[
                            { value: '0', label: 'Tidak Terkunci' },
                            { value: '1', label: 'Terkunci' },
                        ]}
                        onValueChange={(value) =>
                            onChangeField('terkunci', value === '1')
                        }
                        searchable={false}
                    />
                </div>

                <div className="mt-4 flex gap-2">
                    <Button
                        type="button"
                        disabled={isSubmitting || isProcessing}
                        loading={isSubmitting || isProcessing}
                        onClick={onPrimaryAction}
                    >
                        {editingJenisSimpanan
                            ? 'Update Jenis Simpanan'
                            : 'Simpan Jenis Simpanan'}
                    </Button>
                    {editingJenisSimpanan && (
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

import type { FormEvent } from 'react';
import Button from '@/components/button';
import FloatingInput from '@/components/floating-input/input';
import FloatingSelect from '@/components/floating-input/select';
import FloatingTextarea from '@/components/floating-input/textarea';
import type { AnggotaForm, AnggotaRow, AnggotaStatus } from '../types';

type InputField =
    | 'no_anggota'
    | 'nik'
    | 'nama'
    | 'alamat'
    | 'no_hp'
    | 'no_hp_cadangan'
    | 'status'
    | 'tanggal_bergabung';

type ErrorBag = Partial<Record<InputField, string>>;

type Props = {
    editingAnggota: AnggotaRow | null;
    createData: AnggotaForm;
    updateData: AnggotaForm;
    createErrors: ErrorBag;
    updateErrors: ErrorBag;
    createProcessing: boolean;
    updateProcessing: boolean;
    isSubmitting: boolean;
    statusOptions: AnggotaStatus[];
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onPrimaryAction: () => void;
    onCancelEdit: () => void;
    onChangeField: (field: InputField, value: string) => void;
};

const statusLabelMap: Record<AnggotaStatus, string> = {
    aktif: 'Aktif',
    nonaktif: 'Nonaktif',
    keluar: 'Keluar',
};

function digitsOnly(value: string): string {
    return value.replace(/\D/g, '');
}

export default function AnggotaFormCard({
    editingAnggota,
    createData,
    updateData,
    createErrors,
    updateErrors,
    createProcessing,
    updateProcessing,
    isSubmitting,
    statusOptions,
    onSubmit,
    onPrimaryAction,
    onCancelEdit,
    onChangeField,
}: Props) {
    const formData = editingAnggota ? updateData : createData;
    const errors = editingAnggota ? updateErrors : createErrors;
    const isProcessing = editingAnggota ? updateProcessing : createProcessing;

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">
                {editingAnggota
                    ? `Edit Anggota: ${editingAnggota.nama}`
                    : 'Tambah Anggota Baru'}
            </h3>

            <form onSubmit={onSubmit} className="mt-4">
                <div className="grid h-full grid-cols-1 items-center gap-4 md:grid-cols-2">
                    <FloatingInput
                        label="No. Anggota"
                        type="no_anggota"
                        value={formData.no_anggota}
                        onChange={(event) =>
                            onChangeField('no_anggota', event.target.value)
                        }
                        placeholder="Contoh: 02.21.449"
                        errorText={errors.no_anggota}
                        required
                    />
                    <FloatingInput
                        label="NIK"
                        value={formData.nik}
                        type="number"
                        min={0}
                        onChange={(event) =>
                            onChangeField('nik', event.target.value)
                        }
                        placeholder="16 digit angka"
                        errorText={errors.nik}
                    />
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
                        label="No. HP"
                        value={formData.no_hp}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={15}
                        onChange={(event) =>
                            onChangeField(
                                'no_hp',
                                digitsOnly(event.target.value),
                            )
                        }
                        errorText={errors.no_hp}
                    />
                    <FloatingInput
                        label="No. HP Cadangan"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={15}
                        value={formData.no_hp_cadangan}
                        onChange={(event) =>
                            onChangeField(
                                'no_hp_cadangan',
                                digitsOnly(event.target.value),
                            )
                        }
                        errorText={errors.no_hp_cadangan}
                    />

                    <FloatingSelect
                        label="Status"
                        value={formData.status}
                        options={statusOptions.map((status) => ({
                            value: status,
                            label: statusLabelMap[status],
                        }))}
                        onValueChange={(value) =>
                            onChangeField('status', value)
                        }
                        errorText={errors.status}
                        searchable={false}
                        required
                    />
                    <FloatingInput
                        type="date"
                        label="Tanggal Bergabung"
                        value={formData.tanggal_bergabung}
                        onChange={(event) =>
                            onChangeField(
                                'tanggal_bergabung',
                                event.target.value,
                            )
                        }
                        required
                        errorText={errors.tanggal_bergabung}
                    />
                    <FloatingInput
                        label="Alamat"
                        value={formData.alamat}
                        onChange={(event) =>
                            onChangeField('alamat', event.target.value)
                        }
                        errorText={errors.alamat}
                    />
                </div>

                <div className="mt-4 flex gap-2 md:col-span-2 lg:col-span-4">
                    <Button
                        type="button"
                        disabled={isSubmitting || isProcessing}
                        loading={isSubmitting || isProcessing}
                        onClick={onPrimaryAction}
                    >
                        {editingAnggota ? 'Update Anggota' : 'Simpan Anggota'}
                    </Button>
                    {editingAnggota && (
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

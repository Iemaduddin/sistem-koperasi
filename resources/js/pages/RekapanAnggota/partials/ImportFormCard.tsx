import Button from '@/components/button';
import FloatingSelect from '@/components/floating-input/select';
import { RefObject } from 'react';
import Tooltip from '@/components/tooltip';
import { HiOutlineInformationCircle, HiOutlineDownload } from 'react-icons/hi';
import { router } from '@inertiajs/react';

type Props = {
    isSubmitting: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
    rekeningKoperasi: Array<{
        id: string;
        nama: string;
        nomor_rekening: string;
    }>;
    selectedRekeningId: string;
    onImport: () => void;
    onFileChange: (file: File | null) => void;
    onRekeningChange: (id: string) => void;
};

export default function ImportFormCard({
    isSubmitting,
    inputRef,
    rekeningKoperasi,
    selectedRekeningId,
    onImport,
    onFileChange,
    onRekeningChange,
}: Props) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold text-slate-900">
                        Import Data Excel
                    </h1>
                    <Tooltip
                        content={
                            <div className="space-y-2 p-1">
                                <p className="mb-1 border-b border-slate-700 pb-1 font-bold">
                                    Panduan Format Excel:
                                </p>
                                <ul className="list-disc space-y-1 pl-4">
                                    <li>
                                        Struktur Header wajib ada di{' '}
                                        <b>Baris 3</b>.
                                    </li>
                                    <li>
                                        Data dimulai dari <b>Baris 4</b>.
                                    </li>
                                    <li>
                                        Kolom wajib: Nomor(A), Nama(B), Tgl
                                        Masuk(C), Tenor(F).
                                    </li>
                                    <li>
                                        Semua sheet diproses kecuali yang
                                        diawali kata <b>"rekap"</b>.
                                    </li>
                                    <li>
                                        Gunakan template untuk memastikan urutan
                                        kolom benar.
                                    </li>
                                </ul>
                            </div>
                        }
                        side="right"
                    >
                        <HiOutlineInformationCircle className="h-4 w-4 cursor-help text-slate-400" />
                    </Tooltip>
                </div>
                <Button
                    variant="warning"
                    styleMode="outline"
                    size="sm"
                    onClick={() => {
                        window.location.href = '/rekapan-anggota/template';
                    }}
                >
                    <HiOutlineDownload className="h-4 w-4" />
                    Download Template
                </Button>
            </div>

            <div className="mt-2 flex items-center justify-between border-b border-slate-100 pb-3">
                <p className="mt-1 text-sm text-slate-600">
                    Halaman ini untuk mengimport data rekapan anggota koperasi.
                    Pastikan anda menggunakan template yang sudah disediakan.
                </p>
            </div>

            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                    onChange={(event) => {
                        onFileChange(event.target.files?.[0] ?? null);
                    }}
                />

                <FloatingSelect
                    value={selectedRekeningId}
                    onChange={(event) => onRekeningChange(event.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
                    label="Pilih Rekening"
                    searchable={false}
                    options={[
                        ...rekeningKoperasi.map((rek) => ({
                            value: rek.id,
                            label: `${rek.nama} (${rek.nomor_rekening})`,
                        })),
                    ]}
                />

                <Button
                    variant="primary"
                    loading={isSubmitting}
                    loadingText="Memproses..."
                    onClick={onImport}
                >
                    Import Data
                </Button>
            </div>
        </div>
    );
}

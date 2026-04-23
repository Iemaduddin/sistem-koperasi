import Button from '@/components/button';
import { RefObject } from 'react';

type Props = {
    isSubmitting: boolean;
    importMode: 'dry-run' | 'persist';
    inputRef: RefObject<HTMLInputElement | null>;
    onImport: () => void;
    onFileChange: (file: File | null) => void;
    onModeChange: (mode: 'dry-run' | 'persist') => void;
};

export default function ImportFormCard({
    isSubmitting,
    importMode,
    inputRef,
    onImport,
    onFileChange,
    onModeChange,
}: Props) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">
                Import Data Excel
            </h2>
            <p className="mt-1 text-xs text-slate-500">
                Parser membaca semua sheet kecuali nama sheet dengan awalan
                rekap, mulai dari baris ke-4.
            </p>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                    onChange={(event) => {
                        onFileChange(event.target.files?.[0] ?? null);
                    }}
                />

                <select
                    value={importMode}
                    onChange={(event) =>
                        onModeChange(
                            event.target.value as 'dry-run' | 'persist',
                        )
                    }
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                    <option value="persist">Persist (simpan ke DB)</option>
                    <option value="dry-run">Dry-run (preview saja)</option>
                </select>

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

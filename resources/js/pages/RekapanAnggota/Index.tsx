import DashboardLayout from '@/layouts/Dashboard/DasboardLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { ReactElement, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import ImportFormCard from './partials/ImportFormCard';
import ImportSummaryCard from './partials/ImportSummaryCard';
import RekapanTabsCard from './partials/RekapanTabsCard';
import { PageProps } from './type';

export default function RekapanAnggotaIndex() {
    const { props } = usePage<{ props: PageProps }>();
    const pageProps = props as unknown as PageProps;
    const anggotaList = pageProps.anggota_list ?? [];
    const anggotaDetailRows = pageProps.anggota_detail_rows ?? [];
    const monthColumns = pageProps.month_columns ?? [];
    const summary = pageProps.import_summary;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importMode, setImportMode] = useState<'dry-run' | 'persist'>(
        'persist',
    );
    const [activeTab, setActiveTab] = useState<'detailed' | 'summary'>(
        'detailed',
    );
    const [rekeningKoperasiId, setRekeningKoperasiId] = useState<string>('');
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleImport = () => {
        if (!selectedFile) {
            toast.error('Silakan pilih file Excel terlebih dahulu.');
            return;
        }

        if (importMode === 'persist' && !rekeningKoperasiId) {
            toast.error('Silakan pilih Rekening Koperasi terlebih dahulu.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('mode', importMode);
        formData.append('rekening_koperasi_id', rekeningKoperasiId);

        setIsSubmitting(true);

        router.post('/rekapan-anggota/import', formData, {
            preserveScroll: true,
            forceFormData: true,
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    firstError
                        ? String(firstError)
                        : 'Terjadi kesalahan saat membaca file.',
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <Head title="Rekapan Anggota" />

            <section className="space-y-4">
                <ImportFormCard
                    isSubmitting={isSubmitting}
                    importMode={importMode}
                    inputRef={inputRef}
                    rekeningKoperasi={pageProps.rekening_koperasi ?? []}
                    selectedRekeningId={rekeningKoperasiId}
                    onImport={handleImport}
                    onFileChange={setSelectedFile}
                    onModeChange={setImportMode}
                    onRekeningChange={setRekeningKoperasiId}
                />

                <RekapanTabsCard
                    anggotaList={anggotaList}
                    anggotaDetailRows={anggotaDetailRows}
                    monthColumns={monthColumns}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />

                {summary && <ImportSummaryCard summary={summary} />}
            </section>
        </>
    );
}

RekapanAnggotaIndex.layout = (page: ReactElement) => (
    <DashboardLayout title="Rekapan Anggota">{page}</DashboardLayout>
);

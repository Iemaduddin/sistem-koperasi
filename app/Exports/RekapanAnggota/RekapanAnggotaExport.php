<?php

namespace App\Exports\RekapanAnggota;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithProperties;

class RekapanAnggotaExport implements WithMultipleSheets, WithProperties
{
    /**
     * @param  array<int, array<string, mixed>>  $anggotaDetailRows
     * @param  array<int, array<string, mixed>>  $anggotaList
     * @param  array<int, array{key: string, label: string}>  $monthColumns
     */
    public function __construct(
        private readonly array $anggotaDetailRows,
        private readonly array $anggotaList,
        private readonly array $monthColumns,
        private readonly bool $isFiltered,
        private readonly string $filterMode,
        private readonly ?string $selectedMonthYear,
        private readonly ?string $selectedYear,
        private readonly string $documentTitle,
    ) {
    }

    /**
     * @return array<string, string>
     */
    public function properties(): array
    {
        return [
            'creator' => 'Koperasi Azzahwa',
            'lastModifiedBy' => 'Sistem Koperasi Azzahwa',
            'title' => $this->documentTitle,
            'description' => 'Dokumen resmi rekapan anggota koperasi.',
            'subject' => 'Laporan Rekapan Anggota',
            'keywords' => 'koperasi, rekapan anggota, laporan, excel',
            'category' => 'Laporan Keanggotaan',
            'company' => 'Koperasi Azzahwa',
            'manager' => 'Pengurus Koperasi Azzahwa',
        ];
    }

    public function sheets(): array
    {
        $sheets = [];

        if (! $this->isFiltered) {
            $sheets[] = new RekapanAnggotaDetailSheetExport(
                'Rekapan Rincian',
                $this->anggotaDetailRows,
                $this->monthColumns,
            );

            $sheets[] = new RekapanAnggotaSummarySheetExport(
                'Rekapan Keseluruhan',
                $this->anggotaList,
            );

            return $sheets;
        }

        if ($this->filterMode === 'year' && $this->selectedYear !== null && $this->selectedYear !== '') {
            $filteredDetailRows = array_values(array_filter(
                $this->anggotaDetailRows,
                fn (array $row): bool => $this->getYearFromTanggalMasuk((string) ($row['tanggal_masuk'] ?? '')) === $this->selectedYear,
            ));

            $sheets[] = new RekapanAnggotaDetailSheetExport(
                'Rincian Tahun ' . $this->selectedYear,
                $filteredDetailRows,
                $this->monthColumns,
            );

            $filteredSummaryRows = array_values(array_filter(
                $this->anggotaList,
                fn (array $row): bool => $this->getYearFromTanggalMasuk((string) ($row['tanggal_masuk'] ?? '')) === $this->selectedYear,
            ));

            $sheets[] = new RekapanAnggotaSummarySheetExport(
                'Keseluruhan Tahun ' . $this->selectedYear,
                $filteredSummaryRows,
            );

            return $sheets;
        }

        $monthKey = $this->selectedMonthYear;
        $monthLabel = $this->resolveMonthLabel($monthKey);

        $filteredDetailRows = array_values(array_filter(
            $this->anggotaDetailRows,
            fn (array $row): bool => $this->getMonthYearFromTanggalMasuk((string) ($row['tanggal_masuk'] ?? '')) === $monthKey,
        ));

        $sheets[] = new RekapanAnggotaDetailSheetExport(
            'Rincian ' . $monthLabel,
            $filteredDetailRows,
            $this->monthColumns,
        );

        $filteredSummaryRows = array_values(array_filter(
            $this->anggotaList,
            fn (array $row): bool => $this->getMonthYearFromTanggalMasuk((string) ($row['tanggal_masuk'] ?? '')) === $monthKey,
        ));

        $sheets[] = new RekapanAnggotaSummarySheetExport(
            'Keseluruhan ' . $monthLabel,
            $filteredSummaryRows,
        );

        return $sheets;
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, string>
     */
    private function extractYearsFromRows(array $rows): array
    {
        $years = [];

        foreach ($rows as $row) {
            $year = $this->getYearFromTanggalMasuk((string) ($row['tanggal_masuk'] ?? ''));
            if ($year !== null) {
                $years[$year] = $year;
            }
        }

        sort($years);

        return array_values($years);
    }

    private function getYearFromTanggalMasuk(string $tanggalMasuk): ?string
    {
        $date = $this->parseTanggalMasuk($tanggalMasuk);
        return $date?->format('Y');
    }

    private function getMonthYearFromTanggalMasuk(string $tanggalMasuk): ?string
    {
        $date = $this->parseTanggalMasuk($tanggalMasuk);
        return $date?->format('Y-m');
    }

    private function parseTanggalMasuk(string $tanggalMasuk): ?Carbon
    {
        try {
            return Carbon::createFromFormat('d-m-Y', $tanggalMasuk);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @return array{key: string, label: string}|null
     */
    private function findMonthColumn(?string $monthKey): ?array
    {
        foreach ($this->monthColumns as $monthColumn) {
            if ((string) ($monthColumn['key'] ?? '') === (string) $monthKey) {
                return $monthColumn;
            }
        }

        return null;
    }

    private function resolveMonthLabel(?string $monthKey): string
    {
        $monthColumn = $this->findMonthColumn($monthKey);
        if ($monthColumn !== null) {
            return (string) $monthColumn['label'];
        }

        if ($monthKey !== null && $monthKey !== '') {
            try {
                return Carbon::createFromFormat('Y-m', $monthKey)
                    ->locale('id')
                    ->translatedFormat('F Y');
            } catch (\Throwable) {
                return $monthKey;
            }
        }

        return 'Data Filter';
    }
}

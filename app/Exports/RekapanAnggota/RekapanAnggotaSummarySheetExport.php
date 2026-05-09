<?php

namespace App\Exports\RekapanAnggota;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class RekapanAnggotaSummarySheetExport implements FromArray, WithEvents, WithTitle
{
    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    public function __construct(
        private readonly string $sheetTitle,
        private readonly array $rows,
    ) {
    }

    /**
     * @return array<int, array<int, mixed>>
     */
    public function array(): array
    {
        $header = [
            'Nomor',
            'Nama',
            'Tanggal Masuk',
            'Tabungan Pokok',
            'Tabungan Wajib',
            'Tabungan Sukarela',
            'Pinjaman Pokok',
            'Pinjaman Total',
            'Terbayar',
            'Sisa',
            'Status',
        ];

        $dataRows = array_map(
            fn (array $row): array => [
                (string) ($row['no_anggota'] ?? '-'),
                (string) ($row['nama'] ?? '-'),
                (string) ($row['tanggal_masuk'] ?? '-'),
                (float) ($row['simpanan_pokok'] ?? 0),
                (float) ($row['simpanan_wajib'] ?? 0),
                (float) ($row['simpanan_sukarela'] ?? 0),
                (float) ($row['pinjaman_pokok'] ?? 0),
                (float) ($row['pinjaman_total'] ?? 0),
                (float) ($row['angsuran_terbayar'] ?? 0),
                (float) ($row['sisa_pinjaman'] ?? 0),
                (string) ($row['status'] ?? '-'),
            ],
            $this->rows,
        );

        return [
            $header,
            ...$dataRows,
        ];
    }

    public function title(): string
    {
        return self::sanitizeSheetTitle($this->sheetTitle);
    }

    /**
     * @return array<string, callable>
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event): void {
                $lastDataRow = max(2, count($this->rows) + 1);

                $event->sheet->getDelegate()->getStyle('A1:K1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => '334155'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'E2E8F0'],
                    ],
                ]);

                $event->sheet->getDelegate()->getStyle("A1:K{$lastDataRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'CBD5E1'],
                        ],
                    ],
                ]);

                foreach (range('A', 'K') as $column) {
                    $event->sheet->getDelegate()->getColumnDimension($column)->setAutoSize(true);
                }

                $event->sheet->getDelegate()->getColumnDimension('A')->setWidth(14);
                $event->sheet->getDelegate()->getColumnDimension('B')->setWidth(26);
                $event->sheet->getDelegate()->getColumnDimension('C')->setWidth(16);
                $event->sheet->getDelegate()->getRowDimension(1)->setRowHeight(24);

                foreach (['D', 'E', 'F', 'G', 'H', 'I', 'J'] as $column) {
                    $event->sheet
                        ->getDelegate()
                        ->getStyle($column . '2:' . $column . $lastDataRow)
                        ->getNumberFormat()
                        ->setFormatCode('"Rp" #,##0');

                    $event->sheet
                        ->getDelegate()
                        ->getStyle($column . '2:' . $column . $lastDataRow)
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                }

                $event->sheet->getDelegate()->getStyle("K2:K{$lastDataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $event->sheet->getDelegate()->getStyle("A2:C{$lastDataRow}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

                for ($row = 2; $row <= $lastDataRow; $row++) {
                    $status = strtoupper(trim((string) $event->sheet->getCell("K{$row}")->getValue()));

                    if ($status === 'AKTIF') {
                        $event->sheet->getDelegate()->getStyle("K{$row}")->applyFromArray([
                            'font' => [
                                'bold' => true,
                                'color' => ['rgb' => '1D4ED8'],
                            ],
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'DBEAFE'],
                            ],
                        ]);
                    } elseif ($status === 'LUNAS') {
                        $event->sheet->getDelegate()->getStyle("K{$row}")->applyFromArray([
                            'font' => [
                                'bold' => true,
                                'color' => ['rgb' => '047857'],
                            ],
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'D1FAE5'],
                            ],
                        ]);
                    }
                }

                if ($lastDataRow >= 2) {
                    for ($row = 2; $row <= $lastDataRow; $row++) {
                        if ($row % 2 === 1) {
                            $event->sheet->getDelegate()->getStyle("A{$row}:K{$row}")->getFill()->applyFromArray([
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F8FAFC'],
                            ]);
                        }
                    }
                }

                $event->sheet->getDelegate()->freezePane('C2');
            },
        ];
    }

    private static function sanitizeSheetTitle(string $title): string
    {
        $cleaned = preg_replace('/[\\\\\/?*\[\]:]/', '-', trim($title)) ?? 'Sheet';
        if ($cleaned === '') {
            $cleaned = 'Sheet';
        }

        return mb_substr($cleaned, 0, 31);
    }
}

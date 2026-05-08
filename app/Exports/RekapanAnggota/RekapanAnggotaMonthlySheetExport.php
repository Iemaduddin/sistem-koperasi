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

class RekapanAnggotaMonthlySheetExport implements FromArray, WithEvents, WithTitle
{
    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    public function __construct(
        private readonly string $sheetTitle,
        private readonly array $rows,
        private readonly string $monthKey,
    ) {
    }

    /**
     * @return array<int, array<int, mixed>>
     */
    public function array(): array
    {
        $rowOne = [
            'Nomor',
            'Nama',
            'Tanggal Masuk',
            'Pinjaman',
            'Angsuran',
            'Tenor',
            'Daftar',
            '',
            '',
            'Transaksi Bulan Ini',
            '',
            '',
        ];

        $rowTwo = [
            '',
            '',
            '',
            '',
            '',
            '',
            'Anggota',
            'Wajib',
            'Sukarela',
            'Angsuran',
            'Wajib',
            'Sukarela',
        ];

        $dataRows = [];
        foreach ($this->rows as $row) {
            $entryForMonth = null;
            foreach ((array) ($row['entries_bulanan'] ?? []) as $entry) {
                if ((string) ($entry['month_key'] ?? '') === $this->monthKey) {
                    $entryForMonth = $entry;
                    break;
                }
            }

            $dataRow = [
                (string) ($row['no_anggota'] ?? '-'),
                (string) ($row['nama'] ?? '-'),
                (string) ($row['tanggal_masuk'] ?? '-'),
                (float) ($row['pinjaman'] ?? 0),
                (float) ($row['angsuran'] ?? 0),
                (int) ($row['tenor'] ?? 0),
                (float) (($row['simpanan_awal']['anggota'] ?? 0)),
                (float) (($row['simpanan_awal']['wajib'] ?? 0)),
                (float) (($row['simpanan_awal']['sukarela'] ?? 0)),
                (float) ($entryForMonth['angsuran'] ?? 0),
                (float) ($entryForMonth['wajib'] ?? 0),
                (float) ($entryForMonth['sukarela'] ?? 0),
            ];

            $dataRows[] = $dataRow;
        }

        return [
            $rowOne,
            $rowTwo,
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
                $columnCount = 12;
                $lastColumn = self::columnFromIndex($columnCount);
                $lastDataRow = max(3, count($this->rows) + 2);

                $event->sheet->mergeCells('A1:A2');
                $event->sheet->mergeCells('B1:B2');
                $event->sheet->mergeCells('C1:C2');
                $event->sheet->mergeCells('D1:D2');
                $event->sheet->mergeCells('E1:E2');
                $event->sheet->mergeCells('F1:F2');
                $event->sheet->mergeCells('G1:I1');
                $event->sheet->mergeCells('J1:L1');

                $event->sheet->getDelegate()->getStyle("A1:{$lastColumn}2")->applyFromArray([
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

                $event->sheet->getDelegate()->getStyle("A2:{$lastColumn}2")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F1F5F9'],
                    ],
                ]);

                $event->sheet->getDelegate()->getStyle("A1:{$lastColumn}{$lastDataRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'CBD5E1'],
                        ],
                    ],
                ]);

                $event->sheet->getDelegate()->freezePane('C3');

                $event->sheet->getDelegate()->getRowDimension(1)->setRowHeight(24);
                $event->sheet->getDelegate()->getRowDimension(2)->setRowHeight(22);

                for ($index = 1; $index <= $columnCount; $index++) {
                    $event->sheet
                        ->getDelegate()
                        ->getColumnDimension(self::columnFromIndex($index))
                        ->setAutoSize(true);
                }

                $event->sheet->getDelegate()->getColumnDimension('A')->setWidth(14);
                $event->sheet->getDelegate()->getColumnDimension('B')->setWidth(26);
                $event->sheet->getDelegate()->getColumnDimension('C')->setWidth(16);

                $numericColumns = ['D', 'E', 'G', 'H', 'I', 'J', 'K', 'L'];

                foreach ($numericColumns as $column) {
                    $event->sheet
                        ->getDelegate()
                        ->getStyle($column . '3:' . $column . $lastDataRow)
                        ->getNumberFormat()
                        ->setFormatCode('"Rp" #,##0');
                }
            },
        ];
    }

    private static function columnFromIndex(int $index): string
    {
        $column = '';
        while ($index > 0) {
            $index--;
            $column = chr(65 + ($index % 26)) . $column;
            $index = (int) ($index / 26);
        }

        return $column;
    }

    private static function sanitizeSheetTitle(string $title): string
    {
        $invalidChars = ['\\', '/', '?', '*', '[', ']', ':', "'", '"'];
        $title = str_replace($invalidChars, '', $title);
        return substr($title, 0, 31);
    }
}

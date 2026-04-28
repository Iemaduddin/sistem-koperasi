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

class RekapanAnggotaDetailSheetExport implements FromArray, WithEvents, WithTitle
{
    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, array{key: string, label: string}>  $monthColumns
     */
    public function __construct(
        private readonly string $sheetTitle,
        private readonly array $rows,
        private readonly array $monthColumns,
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
        ];

        foreach ($this->monthColumns as $month) {
            $rowOne[] = (string) $month['label'];
            $rowOne[] = '';
            $rowOne[] = '';

            $rowTwo[] = 'Angsuran';
            $rowTwo[] = 'Wajib';
            $rowTwo[] = 'Sukarela';
        }

        $dataRows = [];
        foreach ($this->rows as $row) {
            $entryByMonth = [];
            foreach ((array) ($row['entries_bulanan'] ?? []) as $entry) {
                $monthKey = (string) ($entry['month_key'] ?? '');
                if ($monthKey !== '') {
                    $entryByMonth[$monthKey] = $entry;
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
            ];

            foreach ($this->monthColumns as $month) {
                $entry = $entryByMonth[(string) $month['key']] ?? null;
                $dataRow[] = (float) ($entry['angsuran'] ?? 0);
                $dataRow[] = (float) ($entry['wajib'] ?? 0);
                $dataRow[] = (float) ($entry['sukarela'] ?? 0);
            }

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
                $columnCount = 9 + (count($this->monthColumns) * 3);
                $lastColumn = self::columnFromIndex($columnCount);
                $lastDataRow = max(3, count($this->rows) + 2);

                $event->sheet->mergeCells('A1:A2');
                $event->sheet->mergeCells('B1:B2');
                $event->sheet->mergeCells('C1:C2');
                $event->sheet->mergeCells('D1:D2');
                $event->sheet->mergeCells('E1:E2');
                $event->sheet->mergeCells('F1:F2');
                $event->sheet->mergeCells('G1:I1');

                $monthStartIndex = 10;
                foreach ($this->monthColumns as $index => $month) {
                    $start = $monthStartIndex + ($index * 3);
                    $end = $start + 2;
                    $event->sheet->mergeCells(
                        self::columnFromIndex($start) . '1:' . self::columnFromIndex($end) . '1',
                    );
                }

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

                $numericColumns = ['D', 'E', 'G', 'H', 'I'];
                foreach ($this->monthColumns as $index => $month) {
                    $start = 10 + ($index * 3);
                    $numericColumns[] = self::columnFromIndex($start);
                    $numericColumns[] = self::columnFromIndex($start + 1);
                    $numericColumns[] = self::columnFromIndex($start + 2);
                }

                foreach ($numericColumns as $column) {
                    $event->sheet
                        ->getDelegate()
                        ->getStyle($column . '3:' . $column . $lastDataRow)
                        ->getNumberFormat()
                        ->setFormatCode('"Rp" #,##0');

                    $event->sheet
                        ->getDelegate()
                        ->getStyle($column . '3:' . $column . $lastDataRow)
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                }

                $event->sheet->getDelegate()->getStyle("F3:F{$lastDataRow}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_NUMBER);
                $event->sheet->getDelegate()->getStyle("F3:F{$lastDataRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                $event->sheet->getDelegate()->getStyle("A3:C{$lastDataRow}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

                if ($lastDataRow >= 3) {
                    for ($row = 3; $row <= $lastDataRow; $row++) {
                        if ($row % 2 === 0) {
                            $event->sheet->getDelegate()->getStyle("A{$row}:{$lastColumn}{$row}")->getFill()->applyFromArray([
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F8FAFC'],
                            ]);
                        }
                    }
                }
            },
        ];
    }

    private static function columnFromIndex(int $index): string
    {
        $column = '';
        while ($index > 0) {
            $index--;
            $column = chr(($index % 26) + 65) . $column;
            $index = intdiv($index, 26);
        }

        return $column;
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

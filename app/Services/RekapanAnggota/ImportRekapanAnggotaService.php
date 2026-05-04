<?php

namespace App\Services\RekapanAnggota;

use App\Models\Anggota;
use App\Models\AngsuranPinjaman;
use App\Models\JenisSimpanan;
use App\Models\Pinjaman;
use App\Models\RekeningSimpanan;
use App\Models\Simpanan;
use App\Models\TransaksiPinjaman;
use App\Models\TransaksiSimpananBatch;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use RuntimeException;

class ImportRekapanAnggotaService
{
    private const START_ROW = 4;
    private const HEADER_ROW = 3;
    private const MAX_TABLE_ROWS = 300;

    /**
     * @return array<string, mixed>
     */
    public function parseWorkbook(
        UploadedFile $file,
        ?string $userId = null,
        bool $persist = true,
        ?string $rekeningKoperasiId = null,
    ): array
    {
        $sheetRows = Excel::toArray(new class {
        }, $file);
        $worksheetNames = IOFactory::load($file->getRealPath())->getSheetNames();

        if (count($sheetRows) === 0) {
            throw new RuntimeException('File Excel tidak memiliki sheet yang bisa dibaca.');
        }

        $processedSheets = [];
        $skippedSheets = [];
        $headerWarnings = [];
        $invalidRows = [];
        $tableRows = [];
        $isTableTruncated = false;
        $persistRows = [];

        $totalRows = 0;
        $validRows = 0;
        $parsedMonthlyEntries = 0;

        foreach ($sheetRows as $sheetIndex => $rows) {
            $sheetLabel = trim((string) ($worksheetNames[(int) $sheetIndex] ?? $sheetIndex));

            if (preg_match('/^rekap/i', $sheetLabel) === 1) {
                $skippedSheets[] = $sheetLabel;
                continue;
            }

            $sheetHeaderWarnings = $this->validateSheetHeader($sheetLabel, $rows);
            if (count($sheetHeaderWarnings) > 0) {
                $headerWarnings = array_merge($headerWarnings, $sheetHeaderWarnings);
            }

            $remainingTableSlots = max(0, self::MAX_TABLE_ROWS - count($tableRows));
            $sheetResult = $this->parseSheet($sheetLabel, $rows, $remainingTableSlots);

            $processedSheets[] = [
                'sheet' => $sheetLabel,
                'rows_total' => $sheetResult['rows_total'],
                'rows_valid' => $sheetResult['rows_valid'],
                'rows_invalid' => $sheetResult['rows_invalid'],
                'entries_bulanan' => $sheetResult['entries_bulanan'],
            ];

            $totalRows += $sheetResult['rows_total'];
            $validRows += $sheetResult['rows_valid'];
            $parsedMonthlyEntries += $sheetResult['entries_bulanan'];

            if (count($sheetResult['table_rows']) > 0) {
                $tableRows = array_merge($tableRows, $sheetResult['table_rows']);
            }

            if (count($sheetResult['persist_rows']) > 0) {
                $persistRows = array_merge($persistRows, $sheetResult['persist_rows']);
            }

            if ($sheetResult['table_rows_omitted'] > 0) {
                $isTableTruncated = true;
            }

            if (count($sheetResult['invalid_rows']) > 0) {
                $invalidRows = array_merge($invalidRows, $sheetResult['invalid_rows']);
            }
        }

        $persistSummary = null;
        if ($persist) {
            $persistSummary = $this->persistParsedRows(
                rows: $persistRows,
                userId: $this->resolveImportUserId($userId),
                rekeningKoperasiId: $rekeningKoperasiId,
            );
        }

        return [
            'start_row' => self::START_ROW,
            'processed_sheets' => $processedSheets,
            'skipped_sheets' => $skippedSheets,
            'total_rows' => $totalRows,
            'valid_rows' => $validRows,
            'invalid_rows_count' => count($invalidRows),
            'entries_bulanan_count' => $parsedMonthlyEntries,
            'header_warnings' => array_slice($headerWarnings, 0, 100),
            'invalid_rows' => array_slice($invalidRows, 0, 100),
            'table_rows' => $tableRows,
            'table_rows_truncated' => $isTableTruncated,
            'mode' => $persist ? 'persist' : 'dry-run',
            'persist_summary' => $persistSummary,
            'note' => ($persist
                ? 'Data berhasil diparse dan dipersist ke tabel transaksi.'
                : 'Dry-run: data hanya diparse untuk preview, tidak disimpan ke database.') .
                (count($headerWarnings) > 0
                    ? ' Terdapat warning header template, silakan cek ringkasan warning.'
                    : ''),
        ];
    }

    /**
     * @param  array<int, array<int, mixed>>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function validateSheetHeader(string $sheetName, array $rows): array
    {
        $expectedColumns = [
            ['index' => 0, 'expected' => 'Nomor', 'pattern' => '/nomor/i'],
            ['index' => 1, 'expected' => 'Nama', 'pattern' => '/nama/i'],
            ['index' => 2, 'expected' => 'Tanggal Masuk', 'pattern' => '/tanggal\s*masuk|tgl\s*masuk/i'],
            ['index' => 3, 'expected' => 'Pinjaman', 'pattern' => '/pinjaman/i'],
            ['index' => 4, 'expected' => 'Angsuran', 'pattern' => '/angsuran/i'],
            ['index' => 5, 'expected' => 'Tenor', 'pattern' => '/tenor/i'],
            ['index' => 6, 'expected' => 'Simpanan Pokok', 'pattern' => '/pokok/i'],
            ['index' => 7, 'expected' => 'Simpanan Wajib', 'pattern' => '/wajib/i'],
            ['index' => 8, 'expected' => 'Simpanan Sukarela', 'pattern' => '/sukarela/i'],
            ['index' => 9, 'expected' => 'Angsuran Bulanan', 'pattern' => '/angsuran/i'],
            ['index' => 10, 'expected' => 'Simpanan Wajib Bulanan', 'pattern' => '/wajib/i'],
            ['index' => 11, 'expected' => 'Simpanan Sukarela Bulanan', 'pattern' => '/sukarela/i'],
        ];

        $warnings = [];

        foreach ($expectedColumns as $column) {
            $headerValue = $this->resolveHeaderValueForColumn($rows, (int) $column['index']);

            if ($headerValue === null) {
                $warnings[] = [
                    'sheet' => $sheetName,
                    'row' => self::HEADER_ROW,
                    'column' => $this->columnLabelFromIndex((int) $column['index']),
                    'expected' => $column['expected'],
                    'actual' => null,
                    'message' => 'Header kolom tidak terbaca.',
                ];
                continue;
            }

            if (preg_match((string) $column['pattern'], $headerValue) !== 1) {
                $warnings[] = [
                    'sheet' => $sheetName,
                    'row' => self::HEADER_ROW,
                    'column' => $this->columnLabelFromIndex((int) $column['index']),
                    'expected' => $column['expected'],
                    'actual' => $headerValue,
                    'message' => 'Header kolom tidak sesuai template.',
                ];
            }
        }

        return $warnings;
    }

    /**
     * @param  array<int, array<int, mixed>>  $rows
     */
    private function resolveHeaderValueForColumn(array $rows, int $columnIndex): ?string
    {
        // Template kerap memakai merge cell. Ambil nilai non-kosong terakhir
        // dari baris 1 sampai baris header utama.
        for ($rowIndex = self::HEADER_ROW - 1; $rowIndex >= 0; $rowIndex--) {
            $value = $this->normalizeText($rows[$rowIndex][$columnIndex] ?? null);
            if ($value !== null) {
                return $value;
            }
        }

        return null;
    }

    /**
     * @param  array<int, array<int, mixed>>  $rows
     */
    private function isMonthlyHeaderBlockValid(array $rows, int $startColumnIndex): bool
    {
        $expectedPatterns = [
            0 => '/angsuran/i',
            1 => '/wajib/i',
            2 => '/sukarela/i',
        ];

        foreach ($expectedPatterns as $offset => $pattern) {
            $headerValue = $this->normalizeText($rows[self::HEADER_ROW - 1][$startColumnIndex + $offset] ?? null);
            if ($headerValue === null || preg_match($pattern, $headerValue) !== 1) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<int, array<int, mixed>>  $rows
     * @return array<string, mixed>
     */
    private function parseSheet(string $sheetName, array $rows, int $tableRowLimit): array
    {
        $rowsTotal = 0;
        $rowsValid = 0;
        $rowsInvalid = 0;
        $entriesBulanan = 0;
        $invalidRows = [];
        $tableRows = [];
        $tableRowsOmitted = 0;
        $persistRows = [];

        for ($index = self::START_ROW - 1; $index < count($rows); $index++) {
            $row = $rows[$index] ?? [];
            $excelRowNumber = $index + 1;

            $noAnggota = $this->normalizeText($row[0] ?? null);
            $namaAnggota = $this->normalizeText($row[1] ?? null);

            if ($noAnggota === null && $namaAnggota === null) {
                break;
            }

            $rowsTotal++;

            $tanggalMasuk = $this->normalizeDate($row[2] ?? null);
            $tenorBulan = $this->normalizeInteger($row[5] ?? null);

            if ($noAnggota === null || $namaAnggota === null || $tanggalMasuk === null || $tenorBulan === null || $tenorBulan <= 0) {
                $rowsInvalid++;
                $invalidRows[] = [
                    'sheet' => $sheetName,
                    'row' => $excelRowNumber,
                    'message' => 'Kolom A/B/C/F wajib terisi valid.',
                ];
                continue;
            }

            $jumlahPinjaman = $this->normalizeAmount($row[3] ?? null);
            $angsuranBulanan = $this->normalizeAmount($row[4] ?? null);
            $simpananPokokAwal = $this->normalizeAmount($row[6] ?? null);
            $simpananWajibAwal = $this->normalizeAmount($row[7] ?? null);
            $simpananSukarelaAwal = $this->normalizeAmount($row[8] ?? null);

            $bungaPersen = null;
            if ($jumlahPinjaman !== null && $jumlahPinjaman > 0 && $angsuranBulanan !== null) {
                $pokokPerBulan = round($jumlahPinjaman / $tenorBulan, 2);
                $bungaPerBulan = round($angsuranBulanan - $pokokPerBulan, 2);
                $bungaTotal = round($bungaPerBulan * 10, 2);
                $bungaPersen = $this->normalizeBungaPersen(($bungaTotal / $jumlahPinjaman) * 100);
            }

            $bulanan = [];
            $bulanKe = 1;

            while (true) {
                $startColumnIndex = 9 + (($bulanKe - 1) * 3);

                if ($startColumnIndex >= count($row)) {
                    break;
                }

                if (!$this->isMonthlyHeaderBlockValid($rows, $startColumnIndex)) {
                    break;
                }

                $angsuranDibayar = $this->normalizeAmount($row[$startColumnIndex] ?? null);
                $simpananWajibDibayar = $this->normalizeAmount($row[$startColumnIndex + 1] ?? null);
                $simpananSukarelaDibayar = $this->normalizeAmount($row[$startColumnIndex + 2] ?? null);

                if (
                    $angsuranDibayar === null
                    && $simpananWajibDibayar === null
                    && $simpananSukarelaDibayar === null
                ) {
                    $bulanKe++;
                    continue;
                }

                $entriesBulanan++;

                $bulanan[] = [
                    'bulan_ke' => $bulanKe,
                    'kolom_range' => $this->columnLabelFromIndex($startColumnIndex) . '-' . $this->columnLabelFromIndex($startColumnIndex + 2),
                    'tanggal' => $tanggalMasuk->copy()->addMonths($bulanKe)->toDateString(),
                    'angsuran_dibayar' => $angsuranDibayar,
                    'simpanan_wajib_dibayar' => $simpananWajibDibayar,
                    'simpanan_sukarela_dibayar' => $simpananSukarelaDibayar,
                ];

                $bulanKe++;
            }

            $rowsValid++;

            $entryBulananDetail = array_values(array_map(
                fn (array $item): array => [
                    'bulan_ke' => (int) $item['bulan_ke'],
                    'kolom_range' => (string) $item['kolom_range'],
                    'bulan_tahun' => $this->formatBulanTahun((string) $item['tanggal']),
                    'tanggal' => (string) $item['tanggal'],
                    'entry_key' => md5($sheetName . '|' . $excelRowNumber . '|' . $noAnggota . '|' . (string) $item['bulan_ke'] . '|' . (string) $item['kolom_range']),
                    'angsuran_dibayar' => $item['angsuran_dibayar'],
                    'simpanan_wajib_dibayar' => $item['simpanan_wajib_dibayar'],
                    'simpanan_sukarela_dibayar' => $item['simpanan_sukarela_dibayar'],
                ],
                $bulanan,
            ));

            $persistRows[] = [
                'sheet' => $sheetName,
                'row' => $excelRowNumber,
                'import_key' => $this->buildImportRowKey($sheetName, $excelRowNumber, $noAnggota),
                'no_anggota' => $noAnggota,
                'nama' => $namaAnggota,
                'tanggal_masuk' => $tanggalMasuk->toDateString(),
                'pinjaman' => $jumlahPinjaman,
                'angsuran' => $angsuranBulanan,
                'tenor' => $tenorBulan,
                'bunga_persen_hasil' => $bungaPersen,
                'simpanan_awal' => [
                    'pokok' => $simpananPokokAwal,
                    'wajib' => $simpananWajibAwal,
                    'sukarela' => $simpananSukarelaAwal,
                ],
                'entry_bulanan_detail' => $entryBulananDetail,
            ];

            if (count($tableRows) < $tableRowLimit) {
                $entryBulananBulanTahun = array_values(array_map(
                    fn (array $item): string => $this->formatBulanTahun((string) $item['tanggal']),
                    $bulanan,
                ));

                $tableRows[] = [
                    'sheet' => $sheetName,
                    'row' => $excelRowNumber,
                    'no_anggota' => $noAnggota,
                    'nama' => $namaAnggota,
                    'tanggal_masuk' => $tanggalMasuk->toDateString(),
                    'pinjaman' => $jumlahPinjaman,
                    'angsuran' => $angsuranBulanan,
                    'tenor' => $tenorBulan,
                    'bunga_persen_hasil' => $bungaPersen,
                    'simpanan_awal' => [
                        'pokok' => $simpananPokokAwal,
                        'wajib' => $simpananWajibAwal,
                        'sukarela' => $simpananSukarelaAwal,
                    ],
                    'entries_bulanan_terbaca' => count($bulanan),
                    'entry_bulanan_bulan_tahun' => $entryBulananBulanTahun,
                    'entry_bulanan_detail' => $entryBulananDetail,
                ];
            } else {
                $tableRowsOmitted++;
            }
        }

        return [
            'rows_total' => $rowsTotal,
            'rows_valid' => $rowsValid,
            'rows_invalid' => $rowsInvalid,
            'entries_bulanan' => $entriesBulanan,
            'invalid_rows' => $invalidRows,
            'table_rows' => $tableRows,
            'table_rows_omitted' => $tableRowsOmitted,
            'persist_rows' => $persistRows,
        ];
    }

    private function resolveImportUserId(?string $userId): string
    {
        if ($userId !== null && $userId !== '' && User::query()->whereKey($userId)->exists()) {
            return $userId;
        }

        $fallbackUserId = User::query()->orderBy('created_at')->value('id');
        if (!is_string($fallbackUserId) || $fallbackUserId === '') {
            throw new RuntimeException('User untuk import tidak ditemukan. Pastikan tabel users memiliki data.');
        }

        return $fallbackUserId;
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<string, int>
     */
    private function persistParsedRows(array $rows, string $userId, ?string $rekeningKoperasiId): array
    {
        if (count($rows) === 0) {
            return [
                'anggota_created' => 0,
                'anggota_updated' => 0,
                'pinjaman_created' => 0,
                'angsuran_created' => 0,
                'transaksi_pinjaman_created' => 0,
                'rekening_simpanan_created' => 0,
                'batch_simpanan_created' => 0,
                'transaksi_simpanan_created' => 0,
            ];
        }

        $jenisByKode = JenisSimpanan::query()
            ->whereIn('kode', ['POKOK', 'WAJIB', 'SUKARELA'])
            ->get()
            ->keyBy('kode');

        foreach (['POKOK', 'WAJIB', 'SUKARELA'] as $kode) {
            if (!$jenisByKode->has($kode)) {
                throw new RuntimeException("Jenis simpanan dengan kode {$kode} tidak ditemukan.");
            }
        }

        $rekeningKoperasi = $rekeningKoperasiId 
            ? \App\Models\RekeningKoperasi::query()->find($rekeningKoperasiId)
            : null;

        return DB::transaction(function () use ($rows, $userId, $jenisByKode, $rekeningKoperasi): array {
            $summary = [
                'anggota_created' => 0,
                'anggota_updated' => 0,
                'pinjaman_created' => 0,
                'angsuran_created' => 0,
                'transaksi_pinjaman_created' => 0,
                'rekening_simpanan_created' => 0,
                'batch_simpanan_created' => 0,
                'transaksi_simpanan_created' => 0,
            ];

            foreach ($rows as $row) {
                $anggotaResult = $this->upsertAnggota($row);
                $anggota = $anggotaResult['anggota'];
                if ($anggotaResult['created']) {
                    $summary['anggota_created']++;
                }
                if ($anggotaResult['updated']) {
                    $summary['anggota_updated']++;
                }

                $tanggalMasuk = Carbon::parse((string) $row['tanggal_masuk']);

                $initialSimpanan = (array) ($row['simpanan_awal'] ?? []);
                $this->persistSimpananSetoran(
                    anggota: $anggota,
                    userId: $userId,
                    jenisByKode: $jenisByKode->all(),
                    tanggal: $tanggalMasuk,
                    pokok: $this->toAmount($initialSimpanan['pokok'] ?? null),
                    wajib: $this->toAmount($initialSimpanan['wajib'] ?? null),
                    sukarela: $this->toAmount($initialSimpanan['sukarela'] ?? null),
                    keterangan: 'Import saldo awal simpanan',
                    importKey: (string) ($row['import_key'] ?? 'initial'),
                    summary: $summary,
                    rekeningKoperasi: $rekeningKoperasi,
                );

                $pinjaman = $this->upsertPinjaman($anggota, $row);


                if ($pinjaman !== null && $pinjaman->wasRecentlyCreated) {
                    $summary['pinjaman_created']++;
                    
                    // Record Cash Out for Loan Disbursement
                    if ($rekeningKoperasi) {
                        $jumlahPinjaman = (float) $pinjaman->jumlah_pinjaman;
                        $rekeningKoperasi->saldo = round((float) $rekeningKoperasi->saldo - $jumlahPinjaman, 2);
                        $rekeningKoperasi->save();

                        $this->recordCashFlow(
                            rekening: $rekeningKoperasi,
                            jenis: 'keluar',
                            jumlah: $jumlahPinjaman,
                            sumberTipe: 'pinjaman',
                            sumberId: $pinjaman->id,
                            userId: $userId,
                            keterangan: 'Import pencairan pinjaman',
                            createdAt: $tanggalMasuk
                        );
                    }
                }

                $angsuranByKe = $pinjaman !== null ? $this->syncAngsuranPinjaman($pinjaman, $row, $summary) : [];

                $entryBulanan = (array) ($row['entry_bulanan_detail'] ?? []);
                foreach ($entryBulanan as $entry) {
                    $bulanKe = (int) ($entry['bulan_ke'] ?? 0);
                    if ($bulanKe <= 0) {
                        continue;
                    }

                    $tanggalBayar = Carbon::parse((string) ($entry['tanggal'] ?? $tanggalMasuk->copy()->addMonths($bulanKe)->toDateString()));
                    $angsuran = $angsuranByKe[$bulanKe] ?? null;
                    $jumlahBayar = $this->toAmount($entry['angsuran_dibayar'] ?? null);

                    if ($jumlahBayar > 0 && $pinjaman !== null) {
                        if ($angsuran === null || $angsuran->status === 'lunas') {
                            $angsuran = null;
                            foreach ($angsuranByKe as $a) {
                                if ($a->status !== 'lunas') {
                                    $angsuran = $a;
                                    break;
                                }
                            }

                            if ($angsuran === null && count($angsuranByKe) > 0) {
                                $angsuran = end($angsuranByKe) ?: null;
                            }
                        }
                    }

                    if ($jumlahBayar > 0 && $angsuran !== null && $pinjaman !== null) {
                        $transaksiPinjaman = TransaksiPinjaman::query()->firstOrCreate(
                            [
                                'pinjaman_id' => $pinjaman->id,
                                'angsuran_id' => $angsuran->id,
                                'tanggal_bayar' => $tanggalBayar->toDateTimeString(),
                                'jumlah_bayar' => $jumlahBayar,
                                'denda_dibayar' => 0,
                            ],
                            [
                                'created_at' => $tanggalBayar->toDateTimeString(),
                            ],
                        );

                        if ($transaksiPinjaman->wasRecentlyCreated) {
                            $summary['transaksi_pinjaman_created']++;
                            $this->refreshAngsuranStatusFromTransaksi($angsuran);

                            // Record Cash In for Installment Payment
                            if ($rekeningKoperasi && $jumlahBayar > 0) {
                                $rekeningKoperasi->saldo = round((float) $rekeningKoperasi->saldo + $jumlahBayar, 2);
                                $rekeningKoperasi->save();

                                $this->recordCashFlow(
                                    rekening: $rekeningKoperasi,
                                    jenis: 'masuk',
                                    jumlah: $jumlahBayar,
                                    sumberTipe: 'angsuran_pinjaman',
                                    sumberId: $transaksiPinjaman->id,
                                    userId: $userId,
                                    keterangan: "Import angsuran ke-{$angsuran->angsuran_ke} pinjaman",
                                    createdAt: $tanggalBayar
                                );
                            }
                        }
                    }

                    $this->persistSimpananSetoran(
                        anggota: $anggota,
                        userId: $userId,
                        jenisByKode: $jenisByKode->all(),
                        tanggal: $tanggalBayar,
                        pokok: 0,
                        wajib: $this->toAmount($entry['simpanan_wajib_dibayar'] ?? null),
                        sukarela: $this->toAmount($entry['simpanan_sukarela_dibayar'] ?? null),
                        keterangan: 'Import simpanan bulanan',
                        importKey: (string) ($entry['entry_key'] ?? md5(json_encode($entry))),
                        summary: $summary,
                        rekeningKoperasi: $rekeningKoperasi,
                    );
                }

                if ($pinjaman !== null) {
                    $this->refreshPinjamanStatus($pinjaman);
                }
            }

            return $summary;
        });
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{anggota: Anggota, created: bool, updated: bool}
     */
    private function upsertAnggota(array $row): array
    {
        $noAnggota = (string) $row['no_anggota'];
        $nama = (string) $row['nama'];
        $tanggalBergabung = Carbon::parse((string) $row['tanggal_masuk'])->toDateString();

        $existing = Anggota::query()->where('no_anggota', $noAnggota)->first();
        if ($existing instanceof Anggota) {
            $wasUpdated = false;

            if ($existing->nama !== $nama || (string) $existing->tanggal_bergabung !== $tanggalBergabung) {
                $existing->nama = $nama;
                $existing->tanggal_bergabung = $tanggalBergabung;
                $existing->status = 'aktif';
                $existing->save();
                $wasUpdated = true;
            }

            return [
                'anggota' => $existing,
                'created' => false,
                'updated' => $wasUpdated,
            ];
        }

        $anggota = Anggota::query()->create([
            'no_anggota' => $noAnggota,
            'nik' => $this->generateUniqueNik($noAnggota),
            'nama' => $nama,
            'alamat' => '-',
            'no_hp' => '0000000000',
            'no_hp_cadangan' => null,
            'status' => 'aktif',
            'tanggal_bergabung' => $tanggalBergabung,
        ]);

        return [
            'anggota' => $anggota,
            'created' => true,
            'updated' => false,
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function upsertPinjaman(Anggota $anggota, array $row): ?Pinjaman
    {
        $jumlahPinjaman = $this->toAmount($row['pinjaman'] ?? null);
        $tenor = (int) ($row['tenor'] ?? 0);
        if ($jumlahPinjaman <= 0 || $tenor <= 0) {
            return null;
        }

        $tanggalMulai = Carbon::parse((string) $row['tanggal_masuk'])->toDateString();
        $jumlahAngsuran = $this->toAmount($row['angsuran'] ?? null);
        $bungaPersen = $this->normalizeBungaPersen($row['bunga_persen_hasil'] ?? null);

        $pinjaman = Pinjaman::query()->firstOrCreate(
            [
                'anggota_id' => $anggota->id,
                'tanggal_mulai' => $tanggalMulai,
                'jumlah_pinjaman' => $jumlahPinjaman,
                'tenor_bulan' => $tenor,
            ],
            [
                'bunga_persen' => $bungaPersen,
                'jumlah_angsuran' => $jumlahAngsuran,
                'status' => 'aktif',
            ],
        );

        if (!$pinjaman->wasRecentlyCreated) {
            $pinjaman->bunga_persen = $bungaPersen;
            $pinjaman->jumlah_angsuran = $jumlahAngsuran;
            if ($pinjaman->status !== 'aktif' && $pinjaman->status !== 'lunas') {
                $pinjaman->status = 'aktif';
            }
            $pinjaman->save();
        }

        return $pinjaman;
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  array<string, int>  $summary
     * @return array<int, AngsuranPinjaman>
     */
    private function syncAngsuranPinjaman(Pinjaman $pinjaman, array $row, array &$summary): array
    {
        $tenor = (int) $pinjaman->tenor_bulan;
        $jumlahPinjaman = (float) $pinjaman->jumlah_pinjaman;
        $angsuranBulanan = $this->toAmount($row['angsuran'] ?? null);

        $pokokPerBulan = $tenor > 0 ? round($jumlahPinjaman / $tenor, 2) : 0;
        $bungaPerBulan = round(max(0, $angsuranBulanan - $pokokPerBulan), 2);
        $totalTagihan = round($pokokPerBulan + $bungaPerBulan, 2);

        $tanggalMulai = Carbon::parse((string) $pinjaman->tanggal_mulai);
        $result = [];

        for ($i = 1; $i <= $tenor; $i++) {
            $jatuhTempo = $tanggalMulai->copy()->addMonths($i)->toDateString();

            $angsuran = AngsuranPinjaman::query()->firstOrCreate(
                [
                    'pinjaman_id' => $pinjaman->id,
                    'angsuran_ke' => $i,
                ],
                [
                    'tanggal_jatuh_tempo' => $jatuhTempo,
                    'pokok' => $pokokPerBulan,
                    'bunga' => $bungaPerBulan,
                    'denda' => 0,
                    'total_tagihan' => $totalTagihan,
                    'jumlah_dibayar' => 0,
                    'status' => 'belum_bayar',
                ],
            );

            if ($angsuran->wasRecentlyCreated) {
                $summary['angsuran_created']++;
            } else {
                $angsuran->tanggal_jatuh_tempo = $jatuhTempo;
                $angsuran->pokok = $pokokPerBulan;
                $angsuran->bunga = $bungaPerBulan;
                $angsuran->total_tagihan = $totalTagihan;
                $angsuran->save();
            }

            $result[$i] = $angsuran;
        }

        return $result;
    }

    private function refreshAngsuranStatusFromTransaksi(AngsuranPinjaman $angsuran): void
    {
        $totalBayar = (float) TransaksiPinjaman::query()
            ->where('angsuran_id', $angsuran->id)
            ->sum('jumlah_bayar');

        $angsuran->jumlah_dibayar = round($totalBayar, 2);
        if ($totalBayar <= 0) {
            $angsuran->status = 'belum_bayar';
        } elseif ($totalBayar >= (float) $angsuran->total_tagihan) {
            $angsuran->status = 'lunas';
        } else {
            $angsuran->status = 'sebagian';
        }
        $angsuran->save();
    }

    private function refreshPinjamanStatus(Pinjaman $pinjaman): void
    {
        $countBelumLunas = AngsuranPinjaman::query()
            ->where('pinjaman_id', $pinjaman->id)
            ->where('status', '!=', 'lunas')
            ->count();

        $pinjaman->status = $countBelumLunas === 0 ? 'lunas' : 'aktif';
        $pinjaman->save();
    }

    /**
     * @param  array<string, JenisSimpanan>  $jenisByKode
     * @param  array<string, int>  $summary
     */
    private function persistSimpananSetoran(
        Anggota $anggota,
        string $userId,
        array $jenisByKode,
        Carbon $tanggal,
        float $pokok,
        float $wajib,
        float $sukarela,
        string $keterangan,
        string $importKey,
        array &$summary,
        ?\App\Models\RekeningKoperasi $rekeningKoperasi = null,
    ): void {
        $pokok = round($pokok, 2);
        $wajib = round($wajib, 2);
        $sukarela = round($sukarela, 2);

        if ($pokok <= 0 && $wajib <= 0 && $sukarela <= 0) {
            return;
        }

        $batch = $this->getOrCreateBatchSimpanan($anggota, $userId, $tanggal, $summary);

        if ($pokok > 0) {
            $rekening = $this->getOrCreateRekeningSimpanan($anggota, $jenisByKode['POKOK'], $summary);
            $this->createSimpananTransaksi($rekening, $batch, $pokok, $keterangan, $importKey . '|POKOK', $tanggal, $summary, $rekeningKoperasi, $userId);
        }

        if ($wajib > 0) {
            $rekening = $this->getOrCreateRekeningSimpanan($anggota, $jenisByKode['WAJIB'], $summary);
            $this->createSimpananTransaksi($rekening, $batch, $wajib, $keterangan, $importKey . '|WAJIB', $tanggal, $summary, $rekeningKoperasi, $userId);
        }

        if ($sukarela > 0) {
            $rekening = $this->getOrCreateRekeningSimpanan($anggota, $jenisByKode['SUKARELA'], $summary);
            $this->createSimpananTransaksi($rekening, $batch, $sukarela, $keterangan, $importKey . '|SUKARELA', $tanggal, $summary, $rekeningKoperasi, $userId);
        }

        $batchTotal = (float) Simpanan::query()->where('batch_id', $batch->id)->sum('jumlah');
        $batch->total = round($batchTotal, 2);
        $batch->save();
    }

    /**
     * @param  array<string, int>  $summary
     */
    private function getOrCreateBatchSimpanan(
        Anggota $anggota,
        string $userId,
        Carbon $tanggal,
        array &$summary,
    ): TransaksiSimpananBatch {
        $kode = 'IMP-' . strtoupper(substr(md5($anggota->id . '|' . $tanggal->toDateString()), 0, 12));

        $batch = TransaksiSimpananBatch::query()->firstOrCreate(
            ['kode_transaksi' => $kode],
            [
                'anggota_id' => $anggota->id,
                'tanggal_transaksi' => $tanggal->toDateTimeString(),
                'user_id' => $userId,
                'total' => 0,
            ],
        );

        if ($batch->wasRecentlyCreated) {
            $summary['batch_simpanan_created']++;
        }

        return $batch;
    }

    /**
     * @param  array<string, int>  $summary
     */
    private function getOrCreateRekeningSimpanan(
        Anggota $anggota,
        JenisSimpanan $jenis,
        array &$summary,
    ): RekeningSimpanan {
        $rekening = RekeningSimpanan::query()->firstOrCreate(
            [
                'anggota_id' => $anggota->id,
                'jenis_simpanan_id' => $jenis->id,
            ],
            [
                'saldo' => 0,
            ],
        );

        if ($rekening->wasRecentlyCreated) {
            $summary['rekening_simpanan_created']++;
        }

        return $rekening;
    }

    /**
     * @param  array<string, int>  $summary
     */
    private function createSimpananTransaksi(
        RekeningSimpanan $rekening,
        TransaksiSimpananBatch $batch,
        float $jumlah,
        string $keterangan,
        string $importKey,
        Carbon $tanggal,
        array &$summary,
        ?\App\Models\RekeningKoperasi $rekeningKoperasi = null,
        ?string $userId = null,
    ): void {
        $keteranganWithKey = $keterangan . ' [IMP:' . $importKey . ']';

        $trx = Simpanan::query()->firstOrCreate(
            [
                'rekening_simpanan_id' => $rekening->id,
                'batch_id' => $batch->id,
                'jenis_transaksi' => 'setor',
                'jumlah' => $jumlah,
                'keterangan' => $keteranganWithKey,
                'created_at' => $tanggal->toDateTimeString(),
            ],
            [],
        );

        if ($trx->wasRecentlyCreated) {
            $summary['transaksi_simpanan_created']++;
            $rekening->saldo = round((float) $rekening->saldo + $jumlah, 2);
            $rekening->save();

            // Record Cash In for Savings
            if ($rekeningKoperasi) {
                $rekeningKoperasi->saldo = round((float) $rekeningKoperasi->saldo + $jumlah, 2);
                $rekeningKoperasi->save();

                $this->recordCashFlow(
                    rekening: $rekeningKoperasi,
                    jenis: 'masuk',
                    jumlah: $jumlah,
                    sumberTipe: 'simpanan',
                    sumberId: $trx->id,
                    userId: $userId ?? '',
                    keterangan: "Import setoran simpanan [{$rekening->jenisSimpanan->nama}]",
                    createdAt: $tanggal
                );
            }
        }
    }

    private function recordCashFlow(
        \App\Models\RekeningKoperasi $rekening,
        string $jenis,
        float $jumlah,
        string $sumberTipe,
        string $sumberId,
        string $userId,
        string $keterangan,
        Carbon $createdAt
    ): void {
        \App\Models\TransaksiKasKoperasi::query()->create([
            'rekening_koperasi_id' => $rekening->id,
            'jenis' => $jenis,
            'jumlah' => $jumlah,
            'sumber_tipe' => $sumberTipe,
            'sumber_id' => $sumberId,
            'user_id' => $userId,
            'keterangan' => $keterangan,
            'created_at' => $createdAt->toDateTimeString(),
        ]);
    }

    private function toAmount(mixed $value): float
    {
        if ($value === null) {
            return 0.0;
        }

        return round((float) $value, 2);
    }

    private function normalizeBungaPersen(mixed $value): float
    {
        $amount = $this->toAmount($value);

        if ($amount < 0) {
            return 0.0;
        }

        if ($amount > 999.99) {
            return 999.99;
        }

        return $amount;
    }

    private function generateUniqueNik(string $noAnggota): string
    {
        $digits = preg_replace('/\D/', '', $noAnggota) ?? '';
        $digits = str_pad(substr($digits, -12), 12, '0', STR_PAD_LEFT);
        $prefix = '88' . $digits;
        $counter = 0;

        while (true) {
            $suffix = str_pad((string) $counter, 2, '0', STR_PAD_LEFT);
            $candidate = $prefix . $suffix;

            if (!Anggota::query()->where('nik', $candidate)->exists()) {
                return $candidate;
            }

            $counter++;
        }
    }

    private function buildImportRowKey(string $sheetName, int $rowNumber, string $noAnggota): string
    {
        return md5($sheetName . '|' . $rowNumber . '|' . $noAnggota);
    }

    private function normalizeText(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);
        if ($text === '' || $text === '-') {
            return null;
        }

        return $text;
    }

    private function normalizeInteger(mixed $value): ?int
    {
        $number = $this->normalizeAmount($value);

        if ($number === null) {
            return null;
        }

        return (int) round($number);
    }

    private function normalizeAmount(mixed $value): ?float
    {
        if ($value === null) {
            return null;
        }

        if (is_float($value) || is_int($value)) {
            return round((float) $value, 2);
        }

        $raw = trim((string) $value);
        if ($raw === '' || $raw === '-') {
            return null;
        }

        $normalized = str_replace(' ', '', $raw);

        if (str_contains($normalized, ',') && str_contains($normalized, '.')) {
            $normalized = str_replace('.', '', $normalized);
            $normalized = str_replace(',', '.', $normalized);
        } elseif (str_contains($normalized, ',')) {
            $normalized = str_replace(',', '.', $normalized);
        }

        $normalized = preg_replace('/[^0-9.\-]/', '', $normalized) ?? '';

        if ($normalized === '' || !is_numeric($normalized)) {
            return null;
        }

        return round((float) $normalized, 2);
    }

    private function normalizeDate(mixed $value): ?Carbon
    {
        if ($value === null || (is_string($value) && trim($value) === '')) {
            return null;
        }

        if (is_numeric($value)) {
            try {
                return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $value));
            } catch (\Throwable) {
                return null;
            }
        }

        try {
            return Carbon::parse((string) $value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function formatBulanTahun(string $date): string
    {
        $monthNames = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember',
        ];

        $tanggal = Carbon::parse($date);
        $bulan = $monthNames[(int) $tanggal->format('n')] ?? $tanggal->format('F');

        return $bulan . ' ' . $tanggal->format('Y');
    }

    private function columnLabelFromIndex(int $index): string
    {
        $index += 1;
        $label = '';

        while ($index > 0) {
            $mod = ($index - 1) % 26;
            $label = chr(65 + $mod) . $label;
            $index = (int) floor(($index - 1) / 26);
        }

        return $label;
    }
}

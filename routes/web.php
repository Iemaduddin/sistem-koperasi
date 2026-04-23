<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\AnggotaController;
use App\Http\Controllers\JenisSimpananController;
use App\Http\Controllers\RekeningKoperasiController;
use App\Http\Controllers\SimpananDepositoController;
use App\Http\Controllers\SimpananController;
use App\Http\Controllers\PinjamanController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\GuestPortalController;
use App\Http\Controllers\RiwayatTransaksiController;
use App\Http\Controllers\RekapanAnggotaController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::group(['prefix' => 'portal-anggota'], function (): void {
	Route::get('/', [GuestPortalController::class, 'index'])
		->name('guest-portal.index');
	Route::post('/verifikasi', [GuestPortalController::class, 'verify'])
		->name('guest-portal.verify');
	Route::get('/riwayat', [GuestPortalController::class, 'history'])
		->name('guest-portal.history');
	Route::post('/reset', [GuestPortalController::class, 'reset'])
		->name('guest-portal.reset');
});

Route::middleware('guest')->group(function (): void {
	Route::get('/login', [AuthenticatedSessionController::class, 'create'])
		->name('login');
	Route::post('/login', [AuthenticatedSessionController::class, 'store'])
		->name('login.store');
});

Route::middleware(['auth', 'active.user'])->group(function (): void {
	Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
		->name('logout');

	Route::get('/audit', [AuditController::class, 'index'])
		->name('audit.index');

	Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

	Route::middleware(['role:Master Admin'])->group(function (): void {
		// jenis simpanan
		Route::resource('/jenis-simpanan', JenisSimpananController::class)
			->parameters(['jenis-simpanan' => 'jenis_simpanan'])
			->except(['show', 'create', 'edit']);

		// roles management
		Route::resource('/roles', \App\Http\Controllers\RoleController::class)
			->except(['show', 'create', 'edit']);
	});
	Route::middleware(['role:Master Admin|Super Admin'])->group(function (): void {
		// users management
		Route::resource('/users', UserManagementController::class)->except(['show', 'create', 'edit', 'destroy']);
		Route::put('/users/{user}/block', [UserManagementController::class, 'block'])
			->name('users.block');
		Route::put('/users/{user}/unblock', [UserManagementController::class, 'unblock'])
			->name('users.unblock');
		// rekening koperasi
		Route::resource('/rekening-koperasi', RekeningKoperasiController::class)
			->parameters(['rekening-koperasi' => 'rekening_koperasi'])
			->except(['show', 'create', 'edit', 'destroy']);
	});
	Route::middleware(['role:Master Admin|Super Admin|Admin'])->group(function (): void {
		// set anggota koperasi keluar
		Route::get('/anggota/{anggota}/set-keluar-info', [AnggotaController::class, 'getSetKeluarInfo'])
			->name('anggota.set-keluar-info');
		Route::post('/anggota/{anggota}/set-keluar', [AnggotaController::class, 'setKeluar'])
			->name('anggota.set-keluar');
		// anggota koperasi management
		Route::resource('/anggota', AnggotaController::class)
			->parameters(['anggota' => 'anggota'])
			->except(['show', 'create', 'edit']);
		// Simpanan management
		Route::post('/simpanan/tarik-sukarela', [SimpananController::class, 'tarikSukarela'])
			->name('simpanan.tarik-sukarela');
		Route::resource('/simpanan', SimpananController::class)
			->parameters(['simpanan' => 'simpanan'])
			->except(['show', 'create', 'edit', 'update', 'destroy']);
		// Deposito management
		Route::post(
			'/deposito/log-bagi-hasil/{logBagiHasilDeposito}/tarik',
			[SimpananDepositoController::class, 'tarikBagiHasil'],
		)->name('deposito.log-bagi-hasil.tarik');
		Route::post(
			'/deposito/{simpanan_deposito}/tarik-bagi-hasil-kumulatif',
			[SimpananDepositoController::class, 'tarikBagiHasilKumulatif'],
		)->name('deposito.tarik-bagi-hasil-kumulatif');
		Route::resource('/deposito', SimpananDepositoController::class)
			->parameters(['deposito' => 'simpanan_deposito'])
			->except(['show', 'create', 'edit', 'update', 'destroy']);
		// Pinjaman management
		Route::post('/pinjaman/{pinjaman}/bayar', [PinjamanController::class, 'bayarAngsuran'])
			->name('pinjaman.bayar');
		Route::post('/pinjaman/{pinjaman}/pelunasan', [PinjamanController::class, 'pelunasan'])
			->name('pinjaman.pelunasan');
		Route::resource('/pinjaman', PinjamanController::class)
			->parameters(['pinjaman' => 'pinjaman'])
			->except(['create', 'edit', 'update']);
		// Riwayat Transaksi
		Route::get('/riwayat-transaksi', [RiwayatTransaksiController::class, 'index'])
			->name('riwayat-transaksi.index');
		// Rekapan Anggota
		Route::group(['prefix' => 'rekapan-anggota'], function (): void {
			Route::get('/', [RekapanAnggotaController::class, 'index'])
				->name('rekapan-anggota.index');
			Route::get('/export', [RekapanAnggotaController::class, 'export'])
				->name('rekapan-anggota.export');
			Route::post('/import', [RekapanAnggotaController::class, 'import'])
				->name('rekapan-anggota.import');
		});
	});
});

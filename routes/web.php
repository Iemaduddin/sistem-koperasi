<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\AnggotaController;
use App\Http\Controllers\JenisSimpananController;
use App\Http\Controllers\RekeningKoperasiController;
use App\Http\Controllers\SimpananController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');
Route::middleware('guest')->group(function (): void {
	Route::get('/login', [AuthenticatedSessionController::class, 'create'])
		->name('login');
	Route::post('/login', [AuthenticatedSessionController::class, 'store'])
		->name('login.store');
});

Route::middleware('auth')->group(function (): void {
	Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
		->name('logout');

	Route::inertia('/dashboard', 'Dashboard/Dashboard')->name('dashboard');

	Route::middleware(['role:Super Admin'])->group(function (): void {
		// users management
		Route::resource('/users', UserManagementController::class)->except(['show', 'create', 'edit']);
		// jenis simpanan
		Route::resource('/jenis-simpanan', JenisSimpananController::class)
			->parameters(['jenis-simpanan' => 'jenis_simpanan'])
			->except(['show', 'create', 'edit']);
		// rekening koperasi
		Route::resource('/rekening-koperasi', RekeningKoperasiController::class)
			->parameters(['rekening-koperasi' => 'rekening_koperasi'])
			->except(['show', 'create', 'edit', 'destroy']);
		// set anggota koperasi keluar
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
	});
});

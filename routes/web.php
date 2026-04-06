<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\UserManagementController;
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
		Route::resource('/users', UserManagementController::class)->except(['show', 'create', 'edit']);
	});
});

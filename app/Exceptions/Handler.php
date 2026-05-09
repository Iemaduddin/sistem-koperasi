<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Prepare exception for rendering.
     */
    public function render($request, Throwable $exception)
    {
        // Handle HTTP exceptions with Inertia error pages
        if ($exception instanceof HttpException) {
            if ($request->wantsJson()) {
                return parent::render($request, $exception);
            }

            $status = $exception->getStatusCode();

            if (view()->exists("errors.{$status}")) {
                return response()->view("errors.{$status}", [], $status);
            }

            // Return Inertia error pages
            if ($status === 404) {
                return Inertia::render('errors/404');
            }

            if ($status === 403) {
                return Inertia::render('errors/403');
            }

            if ($status === 500) {
                return Inertia::render('errors/500');
            }
        }

        // Default to server error for other exceptions
        if (!$request->wantsJson() && !app()->environment('local')) {
            return Inertia::render('errors/500');
        }

        return parent::render($request, $exception);
    }
}

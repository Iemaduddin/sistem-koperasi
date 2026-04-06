<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {

        $exceptions->render(function (Throwable $e, $request) {
            if ($e instanceof ValidationException) {
                return null;
            }

            if ($request->wantsJson()) {
                return null;
            }

            // Get status code from exception
            $status = 500;
            if ($e instanceof HttpException) {
                $status = $e->getStatusCode();
            }

            // Render error page with status code
            return inertia('errors/ErrorPage', ['status' => $status])->toResponse($request);
        });
    })->create();

<?php

namespace App\Http\Controllers;

use App\Services\AuditService;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function __construct(private readonly AuditService $auditService)
    {
    }

    public function index(): Response
    {
        return Inertia::render('Audit/Index', $this->auditService->getIndexData());
    }
}

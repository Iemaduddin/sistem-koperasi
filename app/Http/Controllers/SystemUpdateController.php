<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class SystemUpdateController extends Controller
{
    public function index()
    {
        return Inertia::render('SystemUpdate/Index');
    }

    public function update()
    {
        $batFile = 'D:\\BackupSistemKoperasi\\update-system.bat';

        pclose(popen("start /B cmd /c \"$batFile\"", "r"));

        return back()->with('success', 'Update sistem sedang berjalan...');
    }
}
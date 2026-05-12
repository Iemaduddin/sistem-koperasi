<?php

namespace App\Http\Controllers;

class SystemUpdateController extends Controller
{
    public function update()
    {
        $batFile = 'D:\\BackupSistemKoperasi\\update-system.bat';

        pclose(popen("start /B cmd /c \"$batFile\"", "r"));

        return back()->with('success', 'Update sistem sedang berjalan...');
    }
}
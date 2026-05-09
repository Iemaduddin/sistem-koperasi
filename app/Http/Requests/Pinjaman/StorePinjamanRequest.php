<?php

namespace App\Http\Requests\Pinjaman;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePinjamanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'anggota_id'       => ['required', 'uuid', Rule::exists('anggota', 'id')],
            'rekening_koperasi_id' => ['required', 'uuid', Rule::exists('rekening_koperasi', 'id')],
            'jumlah_pinjaman'  => ['required', 'numeric', 'min:1'],
            'bunga_persen'     => ['required', 'numeric', 'min:0', 'max:100'],
            'tenor_bulan'      => ['required', 'integer', 'min:1', 'max:360'],
            'tanggal_mulai'    => ['required', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'anggota_id.required'      => 'Anggota wajib dipilih.',
            'anggota_id.exists'        => 'Anggota tidak ditemukan.',
            'rekening_koperasi_id.required' => 'Rekening Koperasi wajib dipilih.',
            'rekening_koperasi_id.exists'   => 'Rekening Koperasi tidak ditemukan.',
            'jumlah_pinjaman.required' => 'Jumlah pinjaman wajib diisi.',
            'jumlah_pinjaman.min'      => 'Jumlah pinjaman minimal Rp 1.',
            'bunga_persen.required'    => 'Bunga persen wajib diisi.',
            'bunga_persen.min'         => 'Bunga tidak boleh negatif.',
            'bunga_persen.max'         => 'Bunga maksimal 100%.',
            'tenor_bulan.required'     => 'Tenor wajib diisi.',
            'tenor_bulan.min'          => 'Tenor minimal 1 bulan.',
            'tenor_bulan.max'          => 'Tenor maksimal 360 bulan.',
            'tanggal_mulai.required'   => 'Tanggal mulai wajib diisi.',
            'tanggal_mulai.date'       => 'Tanggal mulai tidak valid.',
        ];
    }
}

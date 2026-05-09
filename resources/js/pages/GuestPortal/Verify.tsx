import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import Button from '@/components/button';
import FloatingInput from '@/components/floating-input/input';

type VerifyForm = {
    no_anggota: string;
    // no_hp: string;
};

type VerifyPageProps = {
    flash?: {
        error?: string;
    };
};

export default function GuestPortalVerify() {
    const { props } = usePage<{ props: VerifyPageProps }>();
    const pageProps = props as unknown as VerifyPageProps;

    const { data, setData, post, processing, errors, clearErrors } =
        useForm<VerifyForm>({
            no_anggota: '',
            // no_hp: '',
        });

    const formError =
        (errors as Record<string, string | undefined>).auth ??
        pageProps.flash?.error;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        clearErrors();
        post('/portal-anggota/verifikasi');
    };

    return (
        <>
            <Head title="Portal Anggota" />

            <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
                <main className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700">
                        Portal Anggota
                    </p>
                    <h1 className="mt-4 text-2xl font-semibold text-slate-900">
                        Cek Riwayat Transaksi
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Masukkan Nomor Anggota dan No. HP terdaftar untuk
                        melihat data Anda.
                    </p>

                    <form
                        onSubmit={submit}
                        className="mt-6 space-y-4"
                        noValidate
                    >
                        {formError ? (
                            <div
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                                role="alert"
                                aria-live="polite"
                            >
                                {formError}
                            </div>
                        ) : null}

                        <FloatingInput
                            id="no_anggota"
                            label="Nomor Anggota"
                            value={data.no_anggota}
                            onChange={(event) =>
                                setData('no_anggota', event.target.value)
                            }
                            placeholder="Masukkan Nomor Anggota"
                            errorText={errors.no_anggota}
                            type="no_anggota"
                            required
                        />

                        {/* <FloatingInput
                            id="no_hp"
                            label="No. HP"
                            value={data.no_hp}
                            onChange={(event) =>
                                setData('no_hp', event.target.value)
                            }
                            placeholder="Masukkan No. HP"
                            errorText={errors.no_hp}
                            inputMode="tel"
                            required
                        /> */}

                        <Button
                            type="submit"
                            disabled={processing}
                            loading={processing}
                            loadingText="Memverifikasi..."
                            fullWidth
                        >
                            Lihat Riwayat
                        </Button>
                    </form>
                </main>
            </div>
        </>
    );
}

import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent, ReactElement } from 'react';
import AuthLayout from '@/layouts/Auth/AuthLayout';
import Button from '@/components/button';
import FloatingInput from '@/components/floating-input/input';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

export default function Login() {
    const { data, setData, post, processing, errors } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Login" />

            <div className="flex min-h-screen items-center bg-slate-100 p-4 md:p-6">
                <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
                    <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-md backdrop-blur xl:grid-cols-2">
                        <section className="hidden p-10 text-slate-100 xl:flex xl:flex-col xl:justify-between">
                            <div>
                                <p className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
                                    Sistem Koperasi
                                </p>
                                <h1 className="mt-6 text-4xl leading-tight font-semibold text-balance">
                                    Selamat datang kembali.
                                </h1>
                                <p className="mt-3 text-sm text-slate-300">
                                    Kelola data koperasi lebih cepat, rapi, dan
                                    terstruktur.
                                </p>
                            </div>

                            <div className="overflow-hidden">
                                <img
                                    src="/bg-koperasi-login.webp"
                                    alt="Ilustrasi Koperasi"
                                    className="w-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        </section>

                        <section className="flex items-center bg-white p-6 sm:p-8 lg:p-10">
                            <div className="mx-auto w-full max-w-md">
                                <img
                                    src="/logo-azzahwa-horizontal.png"
                                    alt="Logo Azzahwa"
                                    width={300}
                                    height={64}
                                    className="-ml-3 h-28 w-auto object-contain md:-ml-5"
                                />
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
                                    Masuk ke akun Anda
                                </h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    Gunakan email terdaftar untuk melanjutkan ke
                                    dashboard.
                                </p>

                                <form
                                    onSubmit={submit}
                                    className="mt-8 space-y-5"
                                    noValidate
                                >
                                    <FloatingInput
                                        id="email"
                                        type="email"
                                        label="Email"
                                        value={data.email}
                                        onChange={(event) =>
                                            setData('email', event.target.value)
                                        }
                                        autoComplete="email"
                                        placeholder="nama@email.com"
                                        errorText={errors.email}
                                        required
                                    />

                                    <div>
                                        <FloatingInput
                                            id="password"
                                            type="password"
                                            label="Password"
                                            value={data.password}
                                            onChange={(event) =>
                                                setData(
                                                    'password',
                                                    event.target.value,
                                                )
                                            }
                                            autoComplete="current-password"
                                            placeholder="Masukkan password"
                                            errorText={errors.password}
                                            required
                                        />
                                    </div>

                                    <label className="flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={data.remember}
                                            onChange={(event) =>
                                                setData(
                                                    'remember',
                                                    event.target.checked,
                                                )
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        Ingat saya
                                    </label>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        loading={processing}
                                        loadingText="Sedang masuk..."
                                        fullWidth
                                        variant="primary"
                                    >
                                        Masuk
                                    </Button>
                                </form>

                                <p className="mt-6 text-center text-sm text-slate-600">
                                    Belum punya akun?{' '}
                                    <Link
                                        href="#"
                                        className="font-semibold text-orange-600 transition hover:text-orange-700"
                                    >
                                        Hubungi admin
                                    </Link>
                                </p>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}

Login.layout = (page: ReactElement) => <AuthLayout>{page}</AuthLayout>;

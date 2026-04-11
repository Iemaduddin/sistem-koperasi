'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    LuBell,
    LuChevronDown,
    LuLogOut,
    LuPanelLeft,
    LuUser,
    LuX,
} from 'react-icons/lu';
import { toast } from 'react-toastify';

type OpenMenu = 'notification' | 'avatar' | null;

type NavbarProps = {
    title: string;
    userName: string;
    userEmail: string;
    mobileOpen: boolean;
    collapsed: boolean;
    onToggleMobile: () => void;
    onToggleCollapsed: () => void;
};

function getInitialsFromName(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function Navbar({
    title,
    userName,
    userEmail,
    mobileOpen,
    collapsed,
    onToggleMobile,
    onToggleCollapsed,
}: NavbarProps) {
    const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const initials = useMemo(() => getInitialsFromName(userName), [userName]);
    const currentDate = useMemo(
        () =>
            new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }).format(new Date()),
        [],
    );

    const curentTime = useMemo(() => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMenu = (menu: Exclude<OpenMenu, null>) => {
        setOpenMenu((prev) => (prev === menu ? null : menu));
    };
    const iconTriggerClass =
        'h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition hover:bg-blue-100 sm:h-10 sm:w-10';

    const handleSignOut = async () => {
        try {
            router.post('/logout');
        } catch (error) {
            console.error('Error during sign out:', error);
            toast.error('Gagal melakukan logout. Silakan coba lagi.');
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-blue-100 bg-white/95 px-3 backdrop-blur sm:h-16 sm:px-4 lg:h-18 lg:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    className={`${iconTriggerClass} inline-flex lg:hidden`}
                    onClick={onToggleMobile}
                    aria-label={mobileOpen ? 'Tutup sidebar' : 'Buka sidebar'}
                    title={mobileOpen ? 'Tutup sidebar' : 'Buka sidebar'}
                >
                    {mobileOpen ? (
                        <LuX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                        <LuPanelLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                </button>
                <button
                    type="button"
                    className={`${iconTriggerClass} hidden lg:inline-flex`}
                    onClick={onToggleCollapsed}
                    aria-label={
                        collapsed ? 'Expand sidebar' : 'Collapse sidebar'
                    }
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <LuPanelLeft
                        className={`h-3.5 w-3.5 transition-transform sm:h-4 sm:w-4 ${collapsed ? 'rotate-180' : ''}`}
                    />
                </button>
                <div>
                    <p className="truncate text-xs font-semibold text-slate-800 sm:text-sm">
                        {title}
                    </p>
                    <p className="hidden text-xs text-slate-500 md:block lg:text-sm">
                        {currentDate} - {curentTime}
                    </p>
                </div>
            </div>

            <div
                ref={wrapperRef}
                className="relative ml-1 flex shrink-0 items-center gap-2 sm:ml-2 sm:gap-3 lg:gap-4"
            >
                <div className="relative">
                    <button
                        type="button"
                        className={`${iconTriggerClass} inline-flex`}
                        onClick={() => toggleMenu('notification')}
                        aria-label="Open notifications"
                    >
                        <LuBell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    {openMenu === 'notification' && (
                        <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl bg-blue-50 p-3 shadow-sm">
                            <p className="text-sm text-slate-600">
                                No new notifications
                            </p>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 sm:px-3 sm:text-sm"
                        onClick={() => toggleMenu('avatar')}
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold text-blue-800 sm:h-8 sm:w-8 sm:text-sm">
                                {initials}
                            </span>
                            <div className="hidden flex-col gap-1 text-left md:flex">
                                <span className="text-sm font-semibold text-slate-900">
                                    {userName}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {userEmail}
                                </span>
                            </div>
                        </div>
                        <LuChevronDown
                            className={`h-3.5 w-3.5 transition-transform sm:h-4 sm:w-4 ${openMenu === 'avatar' ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {openMenu === 'avatar' && (
                        <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                            <button
                                onClick={handleSignOut}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-700 hover:bg-red-100"
                            >
                                <LuLogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

'use client';

import { Link, router } from '@inertiajs/react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from 'react';
import {
    LuChartColumnIncreasing,
    LuHouse,
    LuBanknote,
    LuUsers,
    LuChevronDown,
    LuCircleDot,
    LuLogOut,
    LuUserCog,
    LuHistory,
    LuShieldCheck,
} from 'react-icons/lu';
import {
    TbCashBanknoteMoveBack,
    TbCashBanknoteMove,
    TbCashRegister,
    TbBuildingBank,
} from 'react-icons/tb';
import type { IconType } from 'react-icons';
import Button from '../../../components/button';
import { toast } from 'react-toastify';
import { dashboard } from '@/routes';
import { index as usersIndex } from '@/routes/users';
import { index as rolesIndex } from '@/routes/roles';

type SidebarItem = {
    id?: string;
    label: string;
    href?: string;
    routeName?: string;
    icon?: IconType;
    roles?: string[];
    children?: SidebarItem[];
};

type SidebarSection = {
    id?: string;
    title?: string;
    items: SidebarItem[];
};

export type { SidebarItem, SidebarSection };

const canAccessItem = (item: SidebarItem, userRoles: string[]): boolean => {
    if (!item.roles || item.roles.length === 0) {
        return true;
    }

    return item.roles.some((role) => userRoles.includes(role));
};

const filterSidebarItemsByRole = (
    items: SidebarItem[],
    userRoles: string[],
): SidebarItem[] => {
    const filtered: SidebarItem[] = [];

    for (const item of items) {
        const children = item.children
            ? filterSidebarItemsByRole(item.children, userRoles)
            : undefined;

        if (!canAccessItem(item, userRoles)) {
            continue;
        }

        if (item.children && (!children || children.length === 0)) {
            continue;
        }

        filtered.push({
            ...item,
            children,
        });
    }

    return filtered;
};

const normalizePath = (path: string) =>
    path === '/' ? '/' : path.replace(/\/$/, '');

const getItemId = (item: SidebarItem, parentId = '') => {
    if (item.id) {
        return parentId ? `${parentId}-${item.id}` : item.id;
    }
    const slug = item.label.toLowerCase().replace(/\s+/g, '-');
    return parentId ? `${parentId}-${slug}` : slug;
};

const isItemActive = (item: SidebarItem, pathname: string): boolean => {
    const currentPath = normalizePath(pathname);

    const itemHref = resolveItemHref(item);

    if (itemHref && normalizePath(itemHref) === currentPath) {
        return true;
    }

    return Boolean(
        item.children?.some((child) => isItemActive(child, currentPath)),
    );
};

const routeNameToUrl: Record<string, () => string> = {
    dashboard: () => dashboard.url(),
    'users.index': () => usersIndex.url(),
    'roles.index': () => rolesIndex.url(),
    'audit.index': () => '/audit',
    'anggota.index': () => '/anggota',
    'jenis-simpanan.index': () => '/jenis-simpanan',
    'rekening-koperasi.index': () => '/rekening-koperasi',
    'simpanan.index': () => '/simpanan',
    'pinjaman.index': () => '/pinjaman',
    'deposito.index': () => '/deposito',
    'riwayat-transaksi.index': () => '/riwayat-transaksi',
};

const resolveItemHref = (item: SidebarItem): string | undefined => {
    if (item.routeName) {
        return routeNameToUrl[item.routeName]?.();
    }

    return item.href;
};

type SidebarEntryProps = {
    item: SidebarItem;
    parentId: string;
    depth: number;
    pathname: string;
    openItems: Record<string, boolean>;
    setOpenItems: Dispatch<SetStateAction<Record<string, boolean>>>;
    collapsed: boolean;
    openFlyoutId: string | null;
    setOpenFlyoutId: Dispatch<SetStateAction<string | null>>;
    onNavigate?: () => void;
};

type FlyoutEntryProps = {
    item: SidebarItem;
    parentId: string;
    pathname: string;
    openItems: Record<string, boolean>;
    setOpenItems: Dispatch<SetStateAction<Record<string, boolean>>>;
    depth?: number;
    onNavigate?: () => void;
};

function FlyoutEntry({
    item,
    parentId,
    pathname,
    openItems,
    setOpenItems,
    depth = 0,
    onNavigate,
}: FlyoutEntryProps) {
    const itemId = getItemId(item, parentId);
    const hasChildren = Boolean(item.children?.length);
    const opened = openItems[itemId] ?? false;
    const active = isItemActive(item, pathname);
    const ItemIcon = item.icon ?? LuCircleDot;

    const baseClass = [
        'flex w-full items-center gap-2 rounded-lg py-2 text-left transition-colors',
        depth === 0 ? 'px-3' : 'px-3 pl-8',
        active
            ? 'bg-blue-100 text-blue-700'
            : 'text-slate-700 hover:bg-blue-50',
    ].join(' ');

    const content = (
        <>
            <ItemIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="flex-1 truncate text-xs font-medium sm:text-sm">
                {item.label}
            </span>
            {hasChildren && (
                <LuChevronDown
                    className={`h-3.5 w-3.5 transition-transform sm:h-4 sm:w-4 ${opened ? 'rotate-180' : ''}`}
                />
            )}
        </>
    );

    return (
        <li>
            {hasChildren ? (
                <button
                    type="button"
                    onClick={() =>
                        setOpenItems((prev) => ({
                            ...prev,
                            [itemId]: !opened,
                        }))
                    }
                    className={baseClass}
                >
                    {content}
                </button>
            ) : (
                <Link
                    href={resolveItemHref(item) ?? '#'}
                    className={baseClass}
                    onClick={onNavigate}
                >
                    {content}
                </Link>
            )}

            {hasChildren && opened && (
                <ul className="mt-1 space-y-1">
                    {item.children?.map((child) => (
                        <FlyoutEntry
                            key={getItemId(child, itemId)}
                            item={child}
                            parentId={itemId}
                            pathname={pathname}
                            openItems={openItems}
                            setOpenItems={setOpenItems}
                            depth={depth + 1}
                            onNavigate={onNavigate}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

function SidebarEntry({
    item,
    parentId,
    depth,
    pathname,
    openItems,
    setOpenItems,
    collapsed,
    openFlyoutId,
    setOpenFlyoutId,
    onNavigate,
}: SidebarEntryProps) {
    const itemId = getItemId(item, parentId);
    const hasChildren = Boolean(item.children?.length);
    const active = isItemActive(item, pathname);
    const opened = openItems[itemId] ?? false;
    const isFlyoutOpen = openFlyoutId === itemId;

    const paddingLeftClass = collapsed
        ? 'px-0 justify-center'
        : depth === 0
          ? 'pl-3'
          : depth === 1
            ? 'pl-9'
            : 'pl-12';

    const baseClass = [
        'relative flex w-full items-center rounded-xl py-2 transition-colors',
        collapsed ? 'gap-0' : 'gap-2',
        paddingLeftClass,
        active
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 '
            : 'text-slate-700 hover:bg-blue-50',
    ].join(' ');

    const lineClass = active
        ? `absolute ${collapsed ? '-right-2 h-8' : '-right-4 h-10'} top-1/2  w-1 -translate-y-1/2 bg-orange-500`
        : 'hidden';
    const ItemIcon = item.icon ?? LuCircleDot;

    const content = (
        <>
            <span className={lineClass} />
            <span className={active ? 'text-blue-700' : 'text-slate-500'}>
                <ItemIcon
                    className={
                        depth === 0
                            ? 'h-4 w-4 sm:h-5 sm:w-5'
                            : 'h-3.5 w-3.5 sm:h-4 sm:w-4'
                    }
                />
            </span>
            {!collapsed && (
                <span className="flex-1 truncate text-left text-sm font-medium sm:text-base">
                    {item.label}
                </span>
            )}
            {hasChildren && (
                <LuChevronDown
                    className={`${collapsed ? 'absolute right-1 h-3 w-3 sm:h-3.5 sm:w-3.5' : 'mr-1 h-4 w-4 sm:h-5 sm:w-5'} transition-transform ${collapsed ? (isFlyoutOpen ? 'rotate-180' : '') : opened ? 'rotate-180' : ''}`}
                />
            )}
        </>
    );

    return (
        <li className="relative">
            {hasChildren ? (
                <button
                    type="button"
                    onClick={() => {
                        if (collapsed) {
                            setOpenFlyoutId((prev) =>
                                prev === itemId ? null : itemId,
                            );
                            return;
                        }
                        setOpenItems((prev) => ({
                            ...prev,
                            [itemId]: !opened,
                        }));
                    }}
                    className={baseClass}
                    title={collapsed ? item.label : undefined}
                >
                    {content}
                </button>
            ) : (
                <Link
                    href={resolveItemHref(item) ?? '#'}
                    className={baseClass}
                    title={collapsed ? item.label : undefined}
                    onClick={onNavigate}
                >
                    {content}
                </Link>
            )}

            {hasChildren && !collapsed && opened && (
                <ul className="mt-1 space-y-1">
                    {item.children?.map((child) => (
                        <SidebarEntry
                            key={getItemId(child, itemId)}
                            item={child}
                            parentId={itemId}
                            depth={Math.min(depth + 1, 2)}
                            pathname={pathname}
                            openItems={openItems}
                            setOpenItems={setOpenItems}
                            collapsed={collapsed}
                            openFlyoutId={openFlyoutId}
                            setOpenFlyoutId={setOpenFlyoutId}
                            onNavigate={onNavigate}
                        />
                    ))}
                </ul>
            )}

            {hasChildren && collapsed && isFlyoutOpen && (
                <div className="absolute top-0 left-full z-30 ml-4 w-64 rounded-xl border border-blue-100 bg-white p-2 shadow-lg">
                    <p className="px-2 pb-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase sm:text-xs">
                        {item.label}
                    </p>
                    <ul className="space-y-1">
                        {item.children?.map((child) => (
                            <FlyoutEntry
                                key={getItemId(child, itemId)}
                                item={child}
                                parentId={itemId}
                                pathname={pathname}
                                openItems={openItems}
                                setOpenItems={setOpenItems}
                                onNavigate={onNavigate}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </li>
    );
}

const menuSections: SidebarSection[] = [
    {
        id: 'dashboard',
        items: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                routeName: 'dashboard',
                icon: LuHouse,
                roles: ['Master Admin', 'Super Admin', 'Admin'],
            },
        ],
    },
    {
        id: 'users',
        items: [
            {
                id: 'users',
                label: 'Users Management',
                routeName: 'users.index',
                icon: LuUsers,
                roles: ['Master Admin', 'Super Admin'],
            },
            {
                id: 'roles',
                label: 'Role Management',
                routeName: 'roles.index',
                icon: LuShieldCheck,
                roles: ['Master Admin'],
            },
        ],
    },
    {
        id: 'master-data',
        title: 'Master Data',
        items: [
            {
                id: 'anggota',
                label: 'Anggota',
                icon: LuUserCog,
                routeName: 'anggota.index',
                roles: ['Master Admin', 'Super Admin'],
            },
            {
                id: 'jenis-simpanan',
                label: 'Jenis Simpanan',
                icon: LuBanknote,
                routeName: 'jenis-simpanan.index',
                roles: ['Master Admin'],
            },
            {
                id: 'rekening-koperasi',
                label: 'Rekening Koperasi',
                icon: TbBuildingBank,
                routeName: 'rekening-koperasi.index',
                roles: ['Master Admin', 'Super Admin'],
            },
        ],
    },
    {
        id: 'transaksi',
        title: 'Transaksi',
        items: [
            {
                id: 'simpanan',
                label: 'Simpanan',
                icon: TbCashBanknoteMoveBack,
                routeName: 'simpanan.index',
                roles: ['Master Admin', 'Super Admin', 'Admin'],
            },
            {
                id: 'pinjaman',
                label: 'Pinjaman',
                icon: TbCashBanknoteMove,
                routeName: 'pinjaman.index',
                roles: ['Master Admin', 'Super Admin', 'Admin'],
            },
            {
                id: 'deposito',
                label: 'Deposito',
                icon: TbCashRegister,
                routeName: 'deposito.index',
                roles: ['Master Admin', 'Super Admin', 'Admin'],
            },
            // {
            //     id: 'transaksi',
            //     label: 'Transaksi',
            //     icon: LuHandshake,
            //     children: [
            //         {
            //             id: 'transaksi-simpanan',
            //             label: 'Simpanan',
            //             icon: LuBanknote,
            //             children: [
            //                 {
            //                     id: 'simpanan-setoran',
            //                     label: 'Setoran',
            //                     href: '/simpanan/setoran',
            //                     icon: LuCreditCard,
            //                 },
            //                 {
            //                     id: 'simpanan-penarikan',
            //                     label: 'Penarikan',
            //                     href: '/simpanan/penarikan',
            //                     icon: LuCircleDollarSign,
            //                 },
            //             ],
            //         },
            //         {
            //             id: 'transaksi-pinjaman',
            //             label: 'Pinjaman',
            //             icon: LuClipboardList,
            //             children: [
            //                 {
            //                     id: 'pinjaman-pengajuan',
            //                     label: 'Pengajuan',
            //                     href: '/pinjaman/pengajuan',
            //                     icon: LuFileSpreadsheet,
            //                 },
            //                 {
            //                     id: 'pinjaman-angsuran',
            //                     label: 'Angsuran',
            //                     href: '/pinjaman/angsuran',
            //                     icon: LuChartColumnIncreasing,
            //                 },
            //             ],
            //         },
            //     ],
            // },
        ],
    },
    {
        id: 'riwayat',
        title: 'Riwayat',
        items: [
            {
                id: 'audit',
                label: 'Riwayat Audit',
                routeName: 'audit.index',
                icon: LuChartColumnIncreasing,
            },
            {
                id: 'riwayat-transaksi',
                label: 'Riwayat Transaksi',
                routeName: 'riwayat-transaksi.index',
                icon: LuHistory,
                roles: ['Master Admin', 'Super Admin', 'Admin'],
            },
        ],
    },
];

type SidebarProps = {
    items?: SidebarItem[];
    currentPath: string;
    mobileOpen: boolean;
    collapsed: boolean;
    userRoles: string[];
    onCloseMobile: () => void;
};

export default function Sidebar({
    items = [],
    currentPath,
    mobileOpen,
    collapsed,
    userRoles,
    onCloseMobile,
}: SidebarProps) {
    const sidebarRef = useRef<HTMLElement | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const handleNavigate = () => {
        if (mobileOpen) {
            onCloseMobile();
        }
    };
    const resolvedSections = useMemo<SidebarSection[]>(() => {
        if (menuSections.length) {
            return menuSections
                .map((section) => ({
                    ...section,
                    items: filterSidebarItemsByRole(section.items, userRoles),
                }))
                .filter((section) => section.items.length > 0);
        }

        if (items.length) {
            const filteredItems = filterSidebarItemsByRole(items, userRoles);

            if (filteredItems.length === 0) {
                return [];
            }

            return [
                {
                    id: 'menu',
                    items: filteredItems,
                },
            ];
        }

        return [];
    }, [items, userRoles]);

    const pathname = useMemo(
        () => normalizePath(currentPath || '/'),
        [currentPath],
    );
    const defaultOpenState = useMemo(() => {
        const open: Record<string, boolean> = {};

        const walk = (list: SidebarItem[], parentId = '') => {
            for (const item of list) {
                const itemId = getItemId(item, parentId);
                if (item.children?.length) {
                    open[itemId] = isItemActive(item, pathname);
                    walk(item.children, itemId);
                }
            }
        };

        for (const section of resolvedSections) {
            const sectionId =
                section.id ??
                (section.title
                    ? section.title.toLowerCase().replace(/\s+/g, '-')
                    : 'section');
            walk(section.items, sectionId);
        }

        return open;
    }, [resolvedSections, pathname]);

    const [openItems, setOpenItems] =
        useState<Record<string, boolean>>(defaultOpenState);
    const [openFlyoutId, setOpenFlyoutId] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setOpenItems(defaultOpenState);
    }, [defaultOpenState]);

    useEffect(() => {
        setOpenFlyoutId(null);
    }, [pathname, collapsed]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const isMobile = window.matchMedia('(max-width: 1023px)').matches;
        if (!isMobile) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = mobileOpen ? 'hidden' : '';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target;
            if (!(target instanceof Node)) {
                return;
            }

            if (sidebarRef.current?.contains(target)) {
                return;
            }

            setOpenFlyoutId(null);
            setOpenItems((prev) => {
                let hasOpened = false;
                const nextState: Record<string, boolean> = { ...prev };

                for (const key of Object.keys(nextState)) {
                    if (nextState[key]) {
                        nextState[key] = false;
                        hasOpened = true;
                    }
                }

                return hasOpened ? nextState : prev;
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const handleSignOut = async () => {
        try {
            router.post('/logout');
        } catch (error) {
            console.error('Error during sign out:', error);
            toast.error('Gagal melakukan logout. Silakan coba lagi.');
        }
    };

    const baseAsideClass =
        'z-30 flex shrink-0 flex-col border-r border-blue-100 bg-white';

    return (
        <>
            <button
                type="button"
                onClick={onCloseMobile}
                className={`fixed inset-0 z-20 bg-slate-900/40 lg:hidden ${isMounted ? 'transition-opacity duration-300 ease-in-out' : 'transition-none'} ${mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
                aria-label="Tutup sidebar"
            />

            <aside
                ref={sidebarRef}
                className={`${baseAsideClass} fixed inset-y-0 left-0 z-30 mt-14 h-dvh w-72 transform transition-[transform,opacity,width] ${isMounted ? 'duration-300 ease-in-out' : 'duration-0'} will-change-transform md:mt-0 lg:fixed ${mobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} ${collapsed ? 'lg:w-20' : 'lg:w-72'} lg:translate-x-0 lg:opacity-100`}
            >
                <div className="flex justify-start p-3">
                    {collapsed ? (
                        <img
                            src="/logo-azzahwa.png"
                            alt="Logo"
                            width={48}
                            height={48}
                            className="mx-auto h-12 w-12 object-contain"
                        />
                    ) : (
                        <img
                            src="/logo-azzahwa-horizontal.png"
                            alt="Logo"
                            width={300}
                            height={64}
                            className="h-16 w-auto max-w-full object-contain"
                        />
                    )}
                </div>

                <nav
                    className={`-mt-3 flex-1 py-3 transition-all duration-300 ${collapsed ? 'overflow-visible px-2' : 'overflow-y-auto px-4'}`}
                >
                    <div className="space-y-4">
                        {resolvedSections.map((section, sectionIndex) => {
                            const sectionId =
                                section.id ??
                                (section.title
                                    ? section.title
                                          .toLowerCase()
                                          .replace(/\s+/g, '-')
                                    : `section-${sectionIndex}`);

                            return (
                                <div key={sectionId} className="space-y-1">
                                    {section.title && (
                                        <p
                                            className={`overflow-hidden px-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase transition-all duration-300 sm:text-xs ${collapsed ? 'max-h-0 opacity-0' : 'max-h-6 opacity-100'}`}
                                        >
                                            {section.title}
                                        </p>
                                    )}
                                    <ul className="space-y-1">
                                        {section.items.map((item) => (
                                            <SidebarEntry
                                                key={getItemId(item, sectionId)}
                                                item={item}
                                                parentId={sectionId}
                                                depth={0}
                                                pathname={pathname}
                                                openItems={openItems}
                                                setOpenItems={setOpenItems}
                                                collapsed={collapsed}
                                                openFlyoutId={openFlyoutId}
                                                setOpenFlyoutId={
                                                    setOpenFlyoutId
                                                }
                                                onNavigate={handleNavigate}
                                            />
                                        ))}
                                    </ul>
                                    {sectionIndex <
                                        resolvedSections.length - 1 &&
                                        section.title && (
                                            <div
                                                className={`mx-2 mt-3 h-px bg-blue-100 transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`}
                                            />
                                        )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                <div className={`py-4 ${collapsed ? 'px-2' : 'px-4'}`}>
                    <Button
                        onClick={handleSignOut}
                        variant="danger"
                        title="Logout"
                        aria-label="Logout"
                        rightIcon={<LuLogOut className="h-4 w-4" />}
                        fullWidth={!collapsed}
                    >
                        {collapsed ? '' : 'Logout'}
                    </Button>
                </div>
            </aside>
        </>
    );
}

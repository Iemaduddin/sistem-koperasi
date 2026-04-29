'use client';

import {
    useId,
    useMemo,
    useState,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import { cn } from '@/utils/general';

export type TabsItem = {
    id: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
    badge?: string | number;
};

export type TabsProps = {
    items: TabsItem[];
    value?: string;
    defaultValue?: string;
    onChange?: (id: string) => void;
    className?: string;
    listClassName?: string;
    panelClassName?: string;
    keepMounted?: boolean;
};

function getFirstEnabledItemId(items: TabsItem[]): string {
    const firstEnabled = items.find((item) => !item.disabled);
    return firstEnabled?.id ?? '';
}

export default function Tabs({
    items,
    value,
    defaultValue,
    onChange,
    className,
    listClassName,
    panelClassName,
    keepMounted = false,
}: TabsProps) {
    const generatedId = useId();
    const firstEnabledId = useMemo(() => getFirstEnabledItemId(items), [items]);

    const [internalValue, setInternalValue] = useState<string>(
        defaultValue &&
            items.some((item) => item.id === defaultValue && !item.disabled)
            ? defaultValue
            : firstEnabledId,
    );

    const activeId = value ?? internalValue;
    const activeItem = useMemo(
        () =>
            items.find((item) => item.id === activeId && !item.disabled) ??
            null,
        [items, activeId],
    );

    const resolvedActiveId = activeItem?.id ?? firstEnabledId;

    const selectTab = (id: string) => {
        const target = items.find((item) => item.id === id);
        if (!target || target.disabled) {
            return;
        }

        if (value === undefined) {
            setInternalValue(id);
        }

        onChange?.(id);
    };

    const enabledItems = useMemo(
        () => items.filter((item) => !item.disabled),
        [items],
    );

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (enabledItems.length === 0) {
            return;
        }

        const currentIndex = Math.max(
            0,
            enabledItems.findIndex((item) => item.id === resolvedActiveId),
        );

        let nextIndex = currentIndex;

        if (event.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % enabledItems.length;
        } else if (event.key === 'ArrowLeft') {
            nextIndex =
                (currentIndex - 1 + enabledItems.length) % enabledItems.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = enabledItems.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        selectTab(enabledItems[nextIndex].id);
    };

    if (items.length === 0) {
        return null;
    }

    return (
        <section
            className={cn(
                'rounded-xl border border-slate-200 bg-white p-4 shadow-sm',
                className,
            )}
        >
            <div
                role="tablist"
                aria-orientation="horizontal"
                onKeyDown={onKeyDown}
                className={cn(
                    'flex gap-2 border-b border-slate-200',
                    listClassName,
                )}
            >
                {items.map((item) => {
                    const isActive = item.id === resolvedActiveId;
                    const tabId = `${generatedId}-tab-${item.id}`;
                    const panelId = `${generatedId}-panel-${item.id}`;

                    return (
                        <button
                            key={item.id}
                            id={tabId}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={panelId}
                            disabled={item.disabled}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => selectTab(item.id)}
                            className={cn(
                                'px-4 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'border-b-2 border-emerald-600 text-emerald-700'
                                    : 'text-slate-600 hover:text-slate-900',
                                item.disabled &&
                                    'cursor-not-allowed opacity-50 hover:text-slate-600',
                            )}
                        >
                            <span>{item.label}</span>
                            {item.badge !== undefined ? (
                                <span
                                    className={cn(
                                        'ml-2 rounded-full px-2 py-0.5 text-xs',
                                        isActive
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-slate-200 text-slate-600',
                                    )}
                                >
                                    {item.badge}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            {keepMounted
                ? items.map((item) => {
                      const tabId = `${generatedId}-tab-${item.id}`;
                      const panelId = `${generatedId}-panel-${item.id}`;
                      const isActive = item.id === resolvedActiveId;

                      return (
                          <div
                              key={item.id}
                              id={panelId}
                              role="tabpanel"
                              aria-labelledby={tabId}
                              hidden={!isActive}
                              className={cn('pt-4', panelClassName)}
                          >
                              {item.content}
                          </div>
                      );
                  })
                : (() => {
                      const current = items.find(
                          (item) => item.id === resolvedActiveId,
                      );

                      if (!current) {
                          return null;
                      }

                      const tabId = `${generatedId}-tab-${current.id}`;
                      const panelId = `${generatedId}-panel-${current.id}`;

                      return (
                          <div
                              id={panelId}
                              role="tabpanel"
                              aria-labelledby={tabId}
                              className={cn('pt-4', panelClassName)}
                          >
                              {current.content}
                          </div>
                      );
                  })()}
        </section>
    );
}

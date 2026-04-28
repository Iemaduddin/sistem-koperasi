import type { TransactionRow } from './types';

export const normalizeText = (value: unknown) =>
    String(value ?? '')
        .toLowerCase()
        .trim();

export function getTransactionDate(transaction: TransactionRow): Date {
    return new Date(transaction.created_at);
}

export function getFilterSummary(filters: {
    jenis: string;
    sumber: string;
    startDate: string;
    endDate: string;
}): string {
    const activeFilters = [
        filters.jenis !== 'all' ? 'jenis' : null,
        filters.sumber !== 'all' ? 'sumber' : null,
        filters.startDate ? 'dari tanggal' : null,
        filters.endDate ? 'sampai tanggal' : null,
    ].filter(Boolean);

    return activeFilters.length > 0
        ? `${activeFilters.length} filter aktif`
        : 'Menampilkan seluruh data';
}

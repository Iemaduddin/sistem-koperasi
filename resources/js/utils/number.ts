export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined || value === 0) {
        return '0';
    }

    const absValue = Math.abs(value);

    // Triliun (1,000,000,000,000+)
    if (absValue >= 1000000000000) {
        const triliun = absValue / 1000000000000;
        const formattedTriliun =
            triliun % 1 === 0
                ? triliun.toString()
                : triliun.toLocaleString('id-ID', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                  });
        return `${value < 0 ? '-' : ''}${formattedTriliun} triliun`;
    }

    // Miliar (1,000,000,000+)
    if (absValue >= 1000000000) {
        const miliar = absValue / 1000000000;
        const formattedMiliar =
            miliar % 1 === 0
                ? miliar.toString()
                : miliar.toLocaleString('id-ID', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                  });
        return `${value < 0 ? '-' : ''}${formattedMiliar} miliar`;
    }

    // Juta (1,000,000+)
    if (absValue >= 1000000) {
        const juta = absValue / 1000000;
        const formattedJuta =
            juta % 1 === 0
                ? juta.toString()
                : juta.toLocaleString('id-ID', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                  });
        return `${value < 0 ? '-' : ''}${formattedJuta} juta`;
    }

    // Ribu (1,000+)
    if (absValue >= 1000) {
        const ribu = absValue / 1000;
        const formattedRibu =
            ribu % 1 === 0
                ? ribu.toString()
                : ribu.toLocaleString('id-ID', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                  });
        return `${value < 0 ? '-' : ''}${formattedRibu} ribu`;
    }

    return value.toLocaleString('id-ID');
}
export function toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) {
        return 0;
    }

    const parsed = Number(value);

    return Number.isNaN(parsed) ? 0 : parsed;
}

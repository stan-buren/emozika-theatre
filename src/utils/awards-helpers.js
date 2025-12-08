
export function getTopAwards(awardsData) {
    const topAwards = [];
    if (!awardsData) return topAwards;

    awardsData.forEach(function (festival) {
        if (!festival.entries) return;
        festival.entries.forEach(function (entry) {
            if (entry.isTop) {
                topAwards.push({
                    festivalId: festival.id,
                    label: entry.status + " — " + festival.title,
                    sublabel: entry.work,
                    level: festival.level,
                    city: festival.city,
                    year: entry.year
                });
            }
        });
    });

    // Sort: Grand Prix (3) > 1st Place (2) > Laureate I (1) > Other (0), then by Year
    topAwards.sort(function (a, b) {
        const score = function (label) {
            if (!label) return 0;
            if (label.indexOf("Гран-при") !== -1) return 3;
            if (label.indexOf("1 место") !== -1) return 2;
            if (label.indexOf("Лауреат I") !== -1) return 1;
            return 0;
        };
        const diff = score(b.label) - score(a.label);
        if (diff !== 0) return diff;
        return (b.year || 0) - (a.year || 0);
    });

    return topAwards;
}

export function getSortedFestivals(awardsData) {
    if (!awardsData) return [];
    return [...awardsData].sort(function (a, b) {
        const maxYearA = a.years && a.years.length ? Math.max(...a.years) : 0;
        const maxYearB = b.years && b.years.length ? Math.max(...b.years) : 0;
        return maxYearB - maxYearA;
    });
}

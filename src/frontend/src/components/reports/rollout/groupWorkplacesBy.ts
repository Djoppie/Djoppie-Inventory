import type { RolloutDayChecklist, RolloutWorkplaceChecklist, RolloutMovementType } from '../../../types/report.types';

export interface GroupedChecklist {
  id: string | number;
  title: string;
  subtitle?: string;
  workplaces: RolloutWorkplaceChecklistWithDate[];
  typeCounts: Record<RolloutMovementType, number>;
  completionPercentage: number;
}

/** Workplace with optional original day context (for non-day groupings so date is preserved). */
export type RolloutWorkplaceChecklistWithDate = RolloutWorkplaceChecklist & { _dayDate?: string };

export type GroupBy = 'day' | 'service' | 'building';

const countTypes = (wps: RolloutWorkplaceChecklistWithDate[]): Record<RolloutMovementType, number> => ({
  Onboarding:  wps.filter(w => w.movementType === 'Onboarding').length,
  Offboarding: wps.filter(w => w.movementType === 'Offboarding').length,
  Swap:        wps.filter(w => w.movementType === 'Swap').length,
  Other:       wps.filter(w => w.movementType === 'Other').length,
});

const completionPct = (wps: RolloutWorkplaceChecklistWithDate[]): number =>
  wps.length === 0 ? 0 : Math.round(100 * wps.filter(w => w.status === 'Completed').length / wps.length);

export const groupWorkplacesBy = (days: RolloutDayChecklist[], by: GroupBy): GroupedChecklist[] => {
  if (by === 'day') {
    return days.map(d => {
      const wps = d.workplaces.map(w => ({ ...w, _dayDate: d.date })) as RolloutWorkplaceChecklistWithDate[];
      return {
        id: d.dayId,
        title: new Date(d.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }),
        subtitle: `${d.completedWorkplaces}/${d.totalWorkplaces} werkplekken`,
        workplaces: wps,
        typeCounts: countTypes(wps),
        completionPercentage: completionPct(wps),
      };
    });
  }

  const allWps: RolloutWorkplaceChecklistWithDate[] = days.flatMap(d => d.workplaces.map(w => ({ ...w, _dayDate: d.date })));
  const keyOf = (w: RolloutWorkplaceChecklistWithDate): string => by === 'service' ? (w.serviceName || 'Onbekend') : (w.buildingName || 'Onbekend');

  const grouped = new Map<string, RolloutWorkplaceChecklistWithDate[]>();
  allWps.forEach(w => {
    const k = keyOf(w);
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(w);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, wps]) => ({
      id: title,
      title,
      subtitle: `${wps.filter(w => w.status === 'Completed').length}/${wps.length} werkplekken`,
      workplaces: wps,
      typeCounts: countTypes(wps),
      completionPercentage: completionPct(wps),
    }));
};

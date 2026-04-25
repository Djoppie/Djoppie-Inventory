import { AssetStatus } from '../types/asset.types';

/**
 * Canonical state-machine allowed transitions for assets.
 * Mirrors AssetStateMachine.cs on the backend.
 *
 * UitDienst is terminal — only reachable via admin override.
 */
export const ALLOWED_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  [AssetStatus.Nieuw]: [AssetStatus.InGebruik, AssetStatus.Stock],
  [AssetStatus.InGebruik]: [
    AssetStatus.Stock,
    AssetStatus.Herstelling,
    AssetStatus.Defect,
    AssetStatus.UitDienst,
  ],
  [AssetStatus.Stock]: [
    AssetStatus.InGebruik,
    AssetStatus.Herstelling,
    AssetStatus.Defect,
    AssetStatus.UitDienst,
  ],
  [AssetStatus.Herstelling]: [
    AssetStatus.InGebruik,
    AssetStatus.Stock,
    AssetStatus.Defect,
    AssetStatus.UitDienst,
  ],
  [AssetStatus.Defect]: [AssetStatus.Herstelling, AssetStatus.UitDienst],
  [AssetStatus.UitDienst]: [], // terminal — admin override only
};

/** All statuses, for use when adminOverride is active. */
export const ALL_STATUSES: AssetStatus[] = [
  AssetStatus.Nieuw,
  AssetStatus.InGebruik,
  AssetStatus.Stock,
  AssetStatus.Herstelling,
  AssetStatus.Defect,
  AssetStatus.UitDienst,
];

/**
 * Returns the allowed target statuses for a given current status.
 * When adminOverride is true, all statuses except the current one are returned.
 */
export function getAllowedTransitions(
  current: AssetStatus,
  adminOverride = false,
): AssetStatus[] {
  if (adminOverride) {
    return ALL_STATUSES.filter((s) => s !== current);
  }
  return ALLOWED_TRANSITIONS[current] ?? [];
}

/** Dutch labels for statuses — consistent with i18n but also usable inline. */
export const STATUS_LABELS: Record<AssetStatus, string> = {
  [AssetStatus.Nieuw]: 'Nieuw',
  [AssetStatus.InGebruik]: 'In gebruik',
  [AssetStatus.Stock]: 'Stock',
  [AssetStatus.Herstelling]: 'Herstelling',
  [AssetStatus.Defect]: 'Defect',
  [AssetStatus.UitDienst]: 'Uit dienst',
};

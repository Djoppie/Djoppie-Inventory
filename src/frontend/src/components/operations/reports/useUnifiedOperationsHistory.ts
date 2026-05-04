/**
 * Unified Operations History hook
 *
 * Merges three independent data sources into a single normalized stream:
 *  - DeploymentHistory: legacy laptop swaps + pre-AssetRequest onboardings/offboardings
 *  - AssetRequest (Completed): the new on/offboarding lifecycle (shipped 2026-04-28)
 *  - RolloutAssetMovement: rollout-driven deployments/decommissions (cross-session endpoint)
 *
 * Split strategy:
 *  - ALL DeploymentHistory rows → Toestellen tab (these are always laptops by construction)
 *  - AssetRequest rows → Toestellen if any line matches laptop/desktop; Werkplek otherwise
 *  - Rollout movement rows → Toestellen if assetName contains device keywords, Werkplek otherwise
 *
 * De-dup: a rollout execution fires both a RolloutAssetMovement AND a DeploymentHistory record.
 *   We prefer the rollout record (richer data). Build a Set of (assetCode + day) keys from rollout
 *   movements first, then drop any DeploymentHistory row whose key falls in that Set.
 *
 * Status field only exists on AssetRequest rows. When a status filter is active,
 * swap rows (DeploymentHistory, rollout movements) are excluded from results — this is intentional.
 */

import { useMemo } from 'react';
import { useDeploymentHistory } from '../../../hooks/useDeployment';
import { useAssetRequests } from '../../../hooks/useAssetRequests';
import { useRolloutMovementsByDate } from '../../../hooks/rollout/useRolloutReports';
import { DeploymentMode } from '../../../types/deployment.types';
import type { DeploymentHistoryItem } from '../../../types/deployment.types';
import type {
  AssetRequestSummaryDto,
  AssetRequestStatus,
  AssetRequestLineSummaryDto,
} from '../../../types/assetRequest.types';
import type { AssetMovementByDate } from '../../../types/report.types';

// ── Discriminated union for a normalized history row ──────────────────────────

export type UnifiedRowKind = 'swap' | 'onboarding' | 'offboarding';
export type UnifiedRowSource = 'deployment' | 'request' | 'rollout';
export type EquipmentCategory = 'device' | 'workplace';

/**
 * How the asset arrived at its current state.
 * Derived from the previousStatus → newStatus transition on rollout movement records.
 */
export type TransitionSource = 'rollout' | 'from-stock' | 'to-stock' | 'other';

export interface UnifiedHistoryRow {
  /** Stable composite ID: source + original ID */
  uid: string;
  kind: UnifiedRowKind;
  source: UnifiedRowSource;
  date: Date;
  /** Display name of the person being on/off-boarded or whose device was swapped */
  employeeName: string;
  employeeEmail?: string;
  employeeUpn?: string;
  employeeId?: number;
  /** Service name from the org hierarchy (only available via AssetRequest or rollout) */
  serviceName?: string;
  workplaceCode?: string;
  workplaceName?: string;
  workplaceId?: number;
  /** Primary asset code displayed in the table (new asset for onboarding/swap, old for offboarding) */
  primaryAssetCode?: string;
  /** Brand + model combined into one string */
  primaryAssetLabel?: string;
  /** Old asset code (swaps and offboardings) */
  oldAssetCode?: string;
  /** Status — only present on AssetRequest rows */
  status?: AssetRequestStatus;
  /** Performed-by name (deployment rows only) */
  performedBy?: string;
  /** The category this row belongs to for tab filtering */
  equipmentCategory: EquipmentCategory;
  /** Lines from AssetRequest (null for deployment rows) */
  lines: AssetRequestLineSummaryDto[];
  /** Raw sources for the detail drawer */
  rawDeployment?: DeploymentHistoryItem;
  rawRequest?: AssetRequestSummaryDto;
  rawMovement?: AssetMovementByDate;
  /**
   * Status-transition classification: how did this asset arrive at its new state.
   * Only populated for rollout movement rows. Undefined for legacy deployment and request rows.
   */
  transitionSource?: TransitionSource;
  /** Rollout session name (available for rollout movement rows) */
  rolloutSessionName?: string;
}

// ── Heuristic: is this asset type a laptop or desktop? ───────────────────────

const DEVICE_KEYWORDS = ['lap', 'desktop', 'desk', 'pc'];

export function isDeviceTypeName(name: string): boolean {
  const lower = name.toLowerCase();
  return DEVICE_KEYWORDS.some((kw) => lower.includes(kw));
}

function categoryForLines(lines: AssetRequestLineSummaryDto[]): EquipmentCategory {
  if (lines.some((l) => isDeviceTypeName(l.assetTypeName))) return 'device';
  return 'workplace';
}

// ── Transition classification ─────────────────────────────────────────────────

/**
 * Classifies how an asset arrived at its new state based on its status transition.
 * Status values match the AssetStatus enum strings (JsonStringEnumConverter).
 */
export function classifyTransition(prev?: string, next?: string): TransitionSource {
  if (!prev || !next) return 'other';
  // Defensive: compare case-insensitively to survive any unexpected casing
  const p = prev.toLowerCase();
  const n = next.toLowerCase();
  if (p === 'nieuw' && n === 'ingebruik') return 'rollout';
  if (p === 'stock' && n === 'ingebruik') return 'from-stock';
  if (p === 'ingebruik' && n === 'stock') return 'to-stock';
  return 'other';
}

// ── Normalization ─────────────────────────────────────────────────────────────

function normalizeDeployment(item: DeploymentHistoryItem): UnifiedHistoryRow {
  let kind: UnifiedRowKind;
  switch (item.mode) {
    case DeploymentMode.Swap:
      kind = 'swap';
      break;
    case DeploymentMode.Offboarding:
      kind = 'offboarding';
      break;
    default:
      kind = 'onboarding';
  }

  const primaryAsset = item.newLaptop ?? item.oldLaptop;
  const primaryLabel = primaryAsset
    ? [primaryAsset.brand, primaryAsset.model].filter(Boolean).join(' ')
    : undefined;

  return {
    uid: `dep-${item.id}`,
    kind,
    source: 'deployment',
    date: new Date(item.deploymentDate),
    employeeName: item.owner.name,
    employeeEmail: item.owner.email,
    workplaceCode: item.physicalWorkplace?.code,
    workplaceName: item.physicalWorkplace?.name,
    workplaceId: item.physicalWorkplace?.id,
    primaryAssetCode: item.newLaptop?.assetCode ?? item.oldLaptop?.assetCode,
    primaryAssetLabel: primaryLabel || undefined,
    oldAssetCode: item.oldLaptop?.assetCode,
    equipmentCategory: 'device', // Deployment rows are always laptops
    performedBy: item.performedBy,
    lines: [],
    rawDeployment: item,
    // DeploymentHistory rows don't carry status transition data
    transitionSource: undefined,
  };
}

function normalizeRequest(req: AssetRequestSummaryDto): UnifiedHistoryRow {
  const kind: UnifiedRowKind =
    req.requestType === 'onboarding' ? 'onboarding' : 'offboarding';

  // For display: pick the first device-type line's assetCode, or just the first line
  const deviceLines = req.lines.filter((l) => isDeviceTypeName(l.assetTypeName));
  const primaryLine = deviceLines[0] ?? req.lines[0];

  const primaryLabel = primaryLine
    ? [primaryLine.brand, primaryLine.model].filter(Boolean).join(' ') || primaryLine.assetTypeName
    : undefined;

  return {
    uid: `req-${req.id}`,
    kind,
    source: 'request',
    date: new Date(req.requestedDate),
    employeeName: req.employeeDisplayName ?? req.requestedFor,
    employeeEmail: req.employeeUpn,
    employeeUpn: req.employeeUpn,
    employeeId: req.employeeId,
    workplaceCode: req.physicalWorkplaceName,
    workplaceName: req.physicalWorkplaceName,
    workplaceId: req.physicalWorkplaceId,
    primaryAssetCode: primaryLine?.assetCode,
    primaryAssetLabel: primaryLabel,
    status: req.status,
    equipmentCategory: categoryForLines(req.lines),
    lines: req.lines,
    rawRequest: req,
    // AssetRequest rows don't carry status transition data (out of scope)
    transitionSource: undefined,
  };
}

function normalizeRolloutMovement(m: AssetMovementByDate): UnifiedHistoryRow {
  // Derive kind from movement type
  let kind: UnifiedRowKind;
  switch (m.movementType) {
    case 'Decommission':
      kind = 'offboarding';
      break;
    case 'Transfer':
      kind = 'swap';
      break;
    default: // 'Deployment'
      kind = 'onboarding';
  }

  const ts = classifyTransition(m.previousStatus, m.newStatus);

  // Employee name: prefer the workplace user (person receiving the asset),
  // fall back to performer (technician doing the rollout)
  const employeeName = m.workplaceUserName ?? m.performedBy ?? 'Onbekend';

  return {
    uid: `mov-${m.id}`,
    kind,
    source: 'rollout',
    date: new Date(m.performedAt),
    employeeName,
    performedBy: m.performedBy,
    serviceName: m.newServiceName ?? m.previousServiceName,
    primaryAssetCode: m.assetCode,
    primaryAssetLabel: m.assetName,
    equipmentCategory: isDeviceTypeName(m.assetName ?? '') ? 'device' : 'workplace',
    lines: [],
    rawMovement: m,
    transitionSource: ts,
    rolloutSessionName: m.sessionName,
    // Rollout movements don't carry a lifecycle status (that belongs to AssetRequest)
    status: undefined,
  };
}

// ── De-dup helpers ────────────────────────────────────────────────────────────

/**
 * Creates a dedup key for an asset movement: (assetCode, date rounded to the day).
 * Rollout movements and their matching deployment records share the same asset + same day.
 */
function movementDedupKey(assetCode: string, date: Date): string {
  return `${assetCode.toLowerCase()}|${date.toISOString().slice(0, 10)}`;
}

// ── Filters passed to the hook ────────────────────────────────────────────────

export interface UnifiedHistoryFilters {
  kinds?: UnifiedRowKind[];
  statuses?: AssetRequestStatus[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  /** Tab: which equipment category to show */
  equipmentCategory?: EquipmentCategory;
  /** Optional filter on how the asset arrived at its state */
  transitionSources?: TransitionSource[];
}

// ── Default date range ────────────────────────────────────────────────────────

function buildDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

// ── The hook itself ───────────────────────────────────────────────────────────

export function useUnifiedOperationsHistory(filters: UnifiedHistoryFilters = {}) {
  // Fetch all deployment history (no pagination — we merge client-side)
  const deploymentQuery = useDeploymentHistory({ pageNumber: 1, pageSize: 500 });

  // Fetch all asset requests (all statuses — we show all, filter client-side)
  const requestQuery = useAssetRequests({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    q: filters.search,
  });

  // Fetch rollout movements. Use UI date range if provided, else last 365 days.
  const defaults = useMemo(() => buildDefaultDateRange(), []);
  const rolloutMovementsQuery = useRolloutMovementsByDate({
    startDate: filters.dateFrom ?? defaults.startDate,
    endDate: filters.dateTo ?? defaults.endDate,
  });

  const isLoading =
    deploymentQuery.isLoading ||
    requestQuery.isLoading ||
    rolloutMovementsQuery.isLoading;

  const error =
    deploymentQuery.error ?? requestQuery.error ?? rolloutMovementsQuery.error;

  const allRows = useMemo<UnifiedHistoryRow[]>(() => {
    const deployRows: UnifiedHistoryRow[] = (deploymentQuery.data?.items ?? []).map(
      normalizeDeployment,
    );
    const reqRows: UnifiedHistoryRow[] = (requestQuery.data ?? []).map(normalizeRequest);
    const movRows: UnifiedHistoryRow[] = (rolloutMovementsQuery.data ?? []).map(
      normalizeRolloutMovement,
    );

    // De-dup: build a Set of (assetCode|date) keys for rollout movement records first.
    // Then suppress any DeploymentHistory row whose key matches — the rollout row is richer.
    const rolloutKeys = new Set<string>();
    for (const row of movRows) {
      if (row.primaryAssetCode) {
        rolloutKeys.add(movementDedupKey(row.primaryAssetCode, row.date));
      }
    }

    const dedupedDeployRows = deployRows.filter((row) => {
      if (!row.primaryAssetCode) return true;
      return !rolloutKeys.has(movementDedupKey(row.primaryAssetCode, row.date));
    });

    // Merge and sort newest-first
    const merged = [...dedupedDeployRows, ...reqRows, ...movRows];
    merged.sort((a, b) => b.date.getTime() - a.date.getTime());
    return merged;
  }, [deploymentQuery.data, requestQuery.data, rolloutMovementsQuery.data]);

  const filteredRows = useMemo<UnifiedHistoryRow[]>(() => {
    let rows = allRows;

    // Equipment category tab
    if (filters.equipmentCategory) {
      rows = rows.filter((r) => r.equipmentCategory === filters.equipmentCategory);
    }

    // Kind filter (swap / onboarding / offboarding)
    if (filters.kinds && filters.kinds.length > 0) {
      rows = rows.filter((r) => filters.kinds!.includes(r.kind));
    }

    // Status filter — excludes deployment and rollout rows (they have no request status)
    if (filters.statuses && filters.statuses.length > 0) {
      rows = rows.filter(
        (r) => r.status !== undefined && filters.statuses!.includes(r.status),
      );
    }

    // Transition source filter
    if (filters.transitionSources && filters.transitionSources.length > 0) {
      rows = rows.filter(
        (r) =>
          r.transitionSource !== undefined &&
          filters.transitionSources!.includes(r.transitionSource),
      );
    }

    // Date range (secondary filter for deployment rows — requests already filtered server-side)
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      rows = rows.filter((r) => r.date >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      rows = rows.filter((r) => r.date <= to);
    }

    // Search (client-side for merged results)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.employeeName?.toLowerCase().includes(q) ||
          r.employeeEmail?.toLowerCase().includes(q) ||
          r.primaryAssetCode?.toLowerCase().includes(q) ||
          r.oldAssetCode?.toLowerCase().includes(q) ||
          r.workplaceCode?.toLowerCase().includes(q) ||
          r.rolloutSessionName?.toLowerCase().includes(q),
      );
    }

    return rows;
  }, [allRows, filters]);

  // KPI computation (always over all rows, ignoring equipmentCategory for global counts)
  const kpis = useMemo(() => {
    const scope = allRows;
    const swaps = scope.filter((r) => r.kind === 'swap').length;
    const onboardings = scope.filter((r) => r.kind === 'onboarding').length;
    const offboardings = scope.filter((r) => r.kind === 'offboarding').length;
    const viaRollout = scope.filter((r) => r.source === 'rollout').length;

    // Service breakdown (from request and rollout rows)
    const serviceCounts = new Map<string, number>();
    scope
      .filter((r) => r.source === 'request' || r.source === 'rollout')
      .forEach((r) => {
        if (r.serviceName) {
          serviceCounts.set(r.serviceName, (serviceCounts.get(r.serviceName) ?? 0) + 1);
        }
      });
    const topService =
      serviceCounts.size > 0
        ? [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
        : undefined;

    // Avg completion time for completed requests (in days)
    const completedReqs = scope.filter(
      (r) => r.source === 'request' && r.status === 'Completed' && r.rawRequest?.completedAt,
    );
    const avgDays =
      completedReqs.length > 0
        ? completedReqs.reduce((sum, r) => {
            const requested = new Date(r.rawRequest!.requestedDate).getTime();
            const completed = new Date(r.rawRequest!.completedAt!).getTime();
            return sum + (completed - requested) / 86_400_000;
          }, 0) / completedReqs.length
        : undefined;

    return {
      total: scope.length,
      swaps,
      onboardings,
      offboardings,
      viaRollout,
      topService,
      avgCompletionDays: avgDays !== undefined ? Math.round(avgDays) : undefined,
    };
  }, [allRows]);

  const refetch = () => {
    deploymentQuery.refetch();
    requestQuery.refetch();
    rolloutMovementsQuery.refetch();
  };

  return {
    rows: filteredRows,
    allRows,
    kpis,
    isLoading,
    isFetching:
      deploymentQuery.isFetching ||
      requestQuery.isFetching ||
      rolloutMovementsQuery.isFetching,
    error,
    refetch,
  };
}

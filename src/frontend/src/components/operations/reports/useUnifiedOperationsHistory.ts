/**
 * Unified Operations History hook
 *
 * Merges two independent data sources into a single normalized stream:
 *  - DeploymentHistory: legacy laptop swaps + pre-AssetRequest onboardings/offboardings
 *  - AssetRequest (Completed): the new on/offboarding lifecycle (shipped 2026-04-28)
 *
 * Split strategy (no dedup needed):
 *  - ALL DeploymentHistory rows → Toestellen tab (these are always laptops by construction)
 *  - AssetRequest rows → Toestellen if any line matches laptop/desktop; Werkplek otherwise
 *
 * Status field only exists on AssetRequest rows. When a status filter is active,
 * swap rows (DeploymentHistory) are excluded from results — this is intentional.
 */

import { useMemo } from 'react';
import { useDeploymentHistory } from '../../../hooks/useDeployment';
import { useAssetRequests } from '../../../hooks/useAssetRequests';
import { DeploymentMode } from '../../../types/deployment.types';
import type { DeploymentHistoryItem } from '../../../types/deployment.types';
import type {
  AssetRequestSummaryDto,
  AssetRequestStatus,
  AssetRequestLineSummaryDto,
} from '../../../types/assetRequest.types';

// ── Discriminated union for a normalized history row ──────────────────────────

export type UnifiedRowKind = 'swap' | 'onboarding' | 'offboarding';
export type UnifiedRowSource = 'deployment' | 'request';
export type EquipmentCategory = 'device' | 'workplace';

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
  /** Service name from the org hierarchy (only available via AssetRequest) */
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
  };
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

  const isLoading = deploymentQuery.isLoading || requestQuery.isLoading;
  const error = deploymentQuery.error ?? requestQuery.error;

  const allRows = useMemo<UnifiedHistoryRow[]>(() => {
    const deployRows: UnifiedHistoryRow[] = (deploymentQuery.data?.items ?? []).map(
      normalizeDeployment,
    );
    const reqRows: UnifiedHistoryRow[] = (requestQuery.data ?? []).map(normalizeRequest);

    // Merge and sort newest-first
    const merged = [...deployRows, ...reqRows];
    merged.sort((a, b) => b.date.getTime() - a.date.getTime());
    return merged;
  }, [deploymentQuery.data, requestQuery.data]);

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

    // Status filter — excludes deployment rows (they have no status)
    if (filters.statuses && filters.statuses.length > 0) {
      rows = rows.filter(
        (r) => r.status !== undefined && filters.statuses!.includes(r.status),
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
          r.workplaceCode?.toLowerCase().includes(q),
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

    // Service breakdown (only from request rows)
    const serviceCounts = new Map<string, number>();
    scope
      .filter((r) => r.source === 'request')
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
      topService,
      avgCompletionDays: avgDays !== undefined ? Math.round(avgDays) : undefined,
    };
  }, [allRows]);

  const refetch = () => {
    deploymentQuery.refetch();
    requestQuery.refetch();
  };

  return {
    rows: filteredRows,
    allRows,
    kpis,
    isLoading,
    isFetching: deploymentQuery.isFetching || requestQuery.isFetching,
    error,
    refetch,
  };
}

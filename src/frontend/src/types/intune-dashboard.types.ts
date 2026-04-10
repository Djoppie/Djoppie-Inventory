export interface DeviceGroupMembership {
  deviceId: string;
  deviceName: string;
  deviceGroups: GroupInfo[];
  userGroups: GroupInfo[];
  retrievedAt: string;
}

export interface GroupInfo {
  id: string;
  displayName: string;
  description?: string;
  groupType?: string;
  isDynamic: boolean;
}

export interface DeviceEventsResponse {
  deviceId: string;
  deviceName: string;
  events: DeviceEvent[];
  retrievedAt: string;
}

export interface DeviceEvent {
  timestamp: string;
  eventType: string;
  severity: 'error' | 'warning' | 'success' | 'info';
  title: string;
  description?: string;
  details?: Record<string, string>;
}

export interface DeviceHealthInfo {
  deviceId: string;
  deviceName: string;
  manufacturer?: string;
  model?: string;
  operatingSystem?: string;
  osVersion?: string;
  osBuildNumber?: string;
  complianceState?: string;
  isCompliant: boolean;
  isEncrypted: boolean;
  isSupervised: boolean;
  enrollmentType?: string;
  totalStorageBytes?: number;
  freeStorageBytes?: number;
  storageUsagePercent?: number;
  physicalMemoryBytes?: number;
  enrolledDateTime?: string;
  lastSyncDateTime?: string;
  lastCheckInDateTime?: string;
  azureAdDeviceId?: string;
  isAzureAdRegistered: boolean;
  userPrincipalName?: string;
  userDisplayName?: string;
  wifiMacAddress?: string;
  ethernetMacAddress?: string;
  healthScore: number;
  healthStatus: string;
  retrievedAt: string;
}

export type DashboardFilter = 'certIssues' | 'nonCompliant' | 'syncStale' | 'laptops' | 'desktops';

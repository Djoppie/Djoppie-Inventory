/**
 * Type definitions for installed software and device health on assets
 * Matches the backend DTOs from DjoppieInventory.Core.DTOs
 */

// ============================================
// Device Health Types
// ============================================

/**
 * Device health information from Intune
 */
export interface DeviceHealth {
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
  healthStatus: 'Healthy' | 'Warning' | 'Critical' | 'Unknown';
  retrievedAt: string;
}

// ============================================
// Live Status Types (for polling/auto-refresh)
// ============================================

/**
 * Lightweight app summary for live status display
 */
export interface DetectedAppSummary {
  displayName: string;
  version?: string;
  publisher?: string;
}

/**
 * Combined live status response from Intune
 * Aggregates device info, compliance, apps summary, and health
 */
export interface DeviceLiveStatus {
  // Whether device was found in Intune
  found: boolean;
  errorMessage?: string;

  // Device identity
  deviceId?: string;
  deviceName: string;
  serialNumber?: string;
  azureAdDeviceId?: string;

  // Hardware
  manufacturer?: string;
  model?: string;
  operatingSystem?: string;
  osVersion?: string;

  // Compliance
  complianceState?: string;
  isCompliant: boolean;
  isEncrypted: boolean;
  isSupervised: boolean;

  // Sync
  lastSyncDateTime?: string;
  enrolledDateTime?: string;

  // User
  userPrincipalName?: string;
  userDisplayName?: string;

  // Storage
  totalStorageBytes?: number;
  freeStorageBytes?: number;
  storageUsagePercent?: number;

  // Memory
  physicalMemoryBytes?: number;

  // Health
  healthScore: number;
  healthStatus: 'Healthy' | 'Warning' | 'Critical' | 'Unknown';

  // Apps summary
  totalDetectedApps: number;
  topApps: DetectedAppSummary[];

  // Metadata
  retrievedAt: string;
}

// ============================================
// Software Types
// ============================================

/**
 * Detected application from Intune
 */
export interface DetectedApp {
  id: string;
  displayName: string;
  version?: string;
  publisher?: string;
  sizeInBytes?: number;
  platform?: string;
  deviceCount: number;
}

/**
 * Response containing device information and detected apps
 */
export interface DeviceDetectedAppsResponse {
  deviceId: string;
  deviceName: string;
  operatingSystem?: string;
  osVersion?: string;
  detectedApps: DetectedApp[];
  totalApps: number;
  lastSyncDateTime?: string;
  retrievedAt: string;
}

/**
 * Legacy interface for backward compatibility with UI components
 */
export interface InstalledSoftware {
  id: string;
  name: string;
  version: string;
  publisher: string;
  installDate?: string;
  size?: number; // Size in MB
  category?: SoftwareCategory;
}

export enum SoftwareCategory {
  Productivity = 'Productivity',
  Development = 'Development',
  Security = 'Security',
  Communication = 'Communication',
  Utilities = 'Utilities',
  Design = 'Design',
  Browser = 'Browser',
  System = 'System',
  Other = 'Other',
}

export interface SoftwareFilters {
  searchQuery: string;
  category: SoftwareCategory | 'all';
  publisher: string | 'all';
}

export type SoftwareSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'publisher-asc'
  | 'publisher-desc'
  | 'date-newest'
  | 'date-oldest'
  | 'size-asc'
  | 'size-desc';

/**
 * Transform DetectedApp from API to InstalledSoftware for UI components
 */
export function detectedAppToInstalledSoftware(app: DetectedApp): InstalledSoftware {
  return {
    id: app.id,
    name: app.displayName,
    version: app.version || '-',
    publisher: app.publisher || 'Unknown',
    size: app.sizeInBytes ? Math.round(app.sizeInBytes / (1024 * 1024)) : undefined, // Convert bytes to MB
    category: categorizeSoftware(app.displayName, app.publisher),
  };
}

/**
 * Categorize software based on name and publisher heuristics
 */
function categorizeSoftware(name: string, publisher?: string): SoftwareCategory {
  const nameLower = name.toLowerCase();
  const publisherLower = (publisher || '').toLowerCase();

  // Browser detection
  if (nameLower.includes('chrome') || nameLower.includes('firefox') ||
      nameLower.includes('edge') || nameLower.includes('safari') ||
      nameLower.includes('opera') || nameLower.includes('brave')) {
    return SoftwareCategory.Browser;
  }

  // Security software
  if (nameLower.includes('antivirus') || nameLower.includes('security') ||
      nameLower.includes('defender') || nameLower.includes('firewall') ||
      nameLower.includes('malware') || nameLower.includes('kaspersky') ||
      nameLower.includes('norton') || nameLower.includes('mcafee')) {
    return SoftwareCategory.Security;
  }

  // Development tools
  if (nameLower.includes('visual studio') || nameLower.includes('code') ||
      nameLower.includes('git') || nameLower.includes('node') ||
      nameLower.includes('python') || nameLower.includes('java') ||
      nameLower.includes('sdk') || nameLower.includes('docker') ||
      nameLower.includes('npm') || nameLower.includes('compiler')) {
    return SoftwareCategory.Development;
  }

  // Communication
  if (nameLower.includes('teams') || nameLower.includes('slack') ||
      nameLower.includes('zoom') || nameLower.includes('skype') ||
      nameLower.includes('outlook') || nameLower.includes('mail') ||
      nameLower.includes('discord') || nameLower.includes('webex')) {
    return SoftwareCategory.Communication;
  }

  // Productivity / Office
  if (nameLower.includes('office') || nameLower.includes('word') ||
      nameLower.includes('excel') || nameLower.includes('powerpoint') ||
      nameLower.includes('onenote') || nameLower.includes('adobe') ||
      nameLower.includes('acrobat') || nameLower.includes('pdf') ||
      publisherLower.includes('microsoft')) {
    return SoftwareCategory.Productivity;
  }

  // Design
  if (nameLower.includes('photoshop') || nameLower.includes('illustrator') ||
      nameLower.includes('figma') || nameLower.includes('sketch') ||
      nameLower.includes('indesign') || nameLower.includes('canva') ||
      nameLower.includes('gimp') || nameLower.includes('paint')) {
    return SoftwareCategory.Design;
  }

  // System utilities
  if (nameLower.includes('driver') || nameLower.includes('update') ||
      nameLower.includes('runtime') || nameLower.includes('redistributable') ||
      nameLower.includes('.net') || nameLower.includes('c++') ||
      nameLower.includes('directx') || nameLower.includes('vcredist')) {
    return SoftwareCategory.System;
  }

  // Utilities
  if (nameLower.includes('7-zip') || nameLower.includes('winrar') ||
      nameLower.includes('notepad') || nameLower.includes('vlc') ||
      nameLower.includes('ccleaner') || nameLower.includes('utility')) {
    return SoftwareCategory.Utilities;
  }

  return SoftwareCategory.Other;
}

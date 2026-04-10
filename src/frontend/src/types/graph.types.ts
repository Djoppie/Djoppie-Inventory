/**
 * Type definitions for Microsoft Graph API responses
 */

export interface GraphUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail?: string;
  department?: string;
  officeLocation?: string;
  jobTitle?: string;
  mobilePhone?: string;
  businessPhones?: string[];
  companyName?: string;
}

export interface IntuneDevice {
  id?: string;
  deviceName?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  operatingSystem?: string;
  osVersion?: string;
  complianceState?: string;
  lastSyncDateTime?: string;
  enrolledDateTime?: string;
  userPrincipalName?: string;
  managementAgent?: string;
}

/**
 * Configuration profile deployment status for a device.
 * Used to check certificate/Wi-Fi profile status and detect
 * issues caused by primary user changes.
 */
export interface DeviceConfigurationStatus {
  deviceId: string;
  deviceName: string;
  primaryUserUpn?: string;
  primaryUserDisplayName?: string;
  enrolledDateTime?: string;
  lastSyncDateTime?: string;
  configurationProfiles: ConfigurationProfileStatus[];
  summary: ConfigurationStatusSummary;
  hasCertificateProfiles: boolean;
  hasCertificateIssues: boolean;
  retrievedAt: string;
}

export interface ConfigurationProfileStatus {
  profileId?: string;
  displayName: string;
  profileType?: string;
  platformType?: string;
  status: string;
  lastReportedDateTime?: string;
  userPrincipalName?: string;
  userDisplayName?: string;
  isCertificateRelated: boolean;
  errorCode?: number;
  settingsInError?: number;
  settingsInConflict?: number;
  certificateStorePath?: string;
  certificateExpiryDate?: string;
  thumbprint?: string;
}

export interface ConfigurationStatusSummary {
  total: number;
  succeeded: number;
  failed: number;
  pending: number;
  error: number;
  notApplicable: number;
  conflict: number;
}

export interface AutopilotDevice {
  id: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  userPrincipalName?: string;
  displayName?: string;
  managedDeviceId?: string;
  deploymentProfileAssignedDateTime?: string;
  deploymentProfileAssignmentStatus?: string;
  azureAdDeviceId?: string;
  azureAdDeviceDisplayName?: string;
  groupTag?: string;
  purchaseOrderIdentifier?: string;
  enrollmentState?: string;
  lastContactedDateTime?: string;
  createdDateTime?: string;
}

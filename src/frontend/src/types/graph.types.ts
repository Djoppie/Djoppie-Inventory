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

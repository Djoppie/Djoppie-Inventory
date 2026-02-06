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

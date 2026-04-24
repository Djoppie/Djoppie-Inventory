export type CredentialStatus = 'Valid' | 'Expiring' | 'Expired';

export type CredentialType = 'Secret' | 'Certificate';

export interface AppCredential {
  appId: string;
  objectId: string;
  displayName: string;
  credentialType: CredentialType;
  keyId?: string | null;
  credentialDisplayName?: string | null;
  startDateTime?: string | null;
  endDateTime?: string | null;
  daysUntilExpiry?: number | null;
  status: CredentialStatus;
}

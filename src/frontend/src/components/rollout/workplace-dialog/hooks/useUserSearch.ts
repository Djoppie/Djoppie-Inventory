/**
 * useUserSearch - Custom hook for user search and device fetching
 *
 * Handles searching Azure AD users and fetching their Intune devices
 * and Djoppie DB assets.
 */

import { useState, useCallback, useRef } from 'react';
import type { GraphUser, IntuneDevice } from '../../../../types/graph.types';
import type { Asset } from '../../../../types/asset.types';
import { graphApi } from '../../../../api/graph.api';
import { intuneApi } from '../../../../api/intune.api';
import { getAssetsByOwner } from '../../../../api/assets.api';

interface UseUserSearchReturn {
  // User search state
  userOptions: GraphUser[];
  userSearchLoading: boolean;
  userDropdownOpen: boolean;

  // Device state
  userDevices: IntuneDevice[];
  ownerAssets: Asset[];
  ownerAssetsLoading: boolean;

  // Actions
  handleUserSearch: (query: string) => void;
  setUserDropdownOpen: (open: boolean) => void;
  fetchUserDevices: (email: string) => Promise<void>;
  clearDevices: () => void;
}

export function useUserSearch(): UseUserSearchReturn {
  // User search state
  const [userOptions, setUserOptions] = useState<GraphUser[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Device state
  const [userDevices, setUserDevices] = useState<IntuneDevice[]>([]);
  const [ownerAssets, setOwnerAssets] = useState<Asset[]>([]);
  const [ownerAssetsLoading, setOwnerAssetsLoading] = useState(false);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUserSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setUserOptions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const users = await graphApi.searchUsers(query, 10);
        setUserOptions(users);
      } catch {
        setUserOptions([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);
  }, []);

  const fetchUserDevices = useCallback(async (email: string) => {
    if (!email) return;

    // Fetch Intune devices
    try {
      const devices = await intuneApi.getDevicesByUser(email);
      setUserDevices(devices);
    } catch {
      setUserDevices([]);
    }

    // Fetch owner assets from Djoppie DB
    setOwnerAssetsLoading(true);
    try {
      const assets = await getAssetsByOwner(email);
      setOwnerAssets(assets);
    } catch {
      setOwnerAssets([]);
    } finally {
      setOwnerAssetsLoading(false);
    }
  }, []);

  const clearDevices = useCallback(() => {
    setUserDevices([]);
    setOwnerAssets([]);
    setUserOptions([]);
  }, []);

  return {
    userOptions,
    userSearchLoading,
    userDropdownOpen,
    userDevices,
    ownerAssets,
    ownerAssetsLoading,
    handleUserSearch,
    setUserDropdownOpen,
    fetchUserDevices,
    clearDevices,
  };
}

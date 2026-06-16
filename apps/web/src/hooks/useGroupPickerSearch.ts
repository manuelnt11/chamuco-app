import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

import { getGroups, searchGroups } from '@/services/groups.service';
import type { Group, GroupSearchResult } from '@/types/group';

export interface GroupPickerSearchResults {
  myGroups: Group[];
  publicGroups: GroupSearchResult[];
  isLoading: boolean;
}

export function useGroupPickerSearch(query: string, limit = 8): GroupPickerSearchResults {
  const [myGroupsCache, setMyGroupsCache] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<GroupSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchedMyGroups = useRef(false);

  useEffect(() => {
    if (fetchedMyGroups.current) return;
    fetchedMyGroups.current = true;
    getGroups()
      .then(setMyGroupsCache)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (!query.trim()) {
      setPublicGroups([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      searchGroups({ q: query, limit }, controller.signal)
        .then((res) => setPublicGroups(res.data))
        .catch((err: unknown) => {
          if (!axios.isCancel(err)) setPublicGroups([]);
        })
        .finally(() => setIsLoading(false));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, limit]);

  const lowerQuery = query.trim().toLowerCase();
  const myGroups = lowerQuery
    ? myGroupsCache.filter((g) => g.name.toLowerCase().includes(lowerQuery))
    : [];

  return { myGroups, publicGroups, isLoading };
}

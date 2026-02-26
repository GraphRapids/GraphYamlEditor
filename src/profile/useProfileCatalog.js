import { useEffect, useMemo, useState } from 'react';
import { createProfileCatalog, EMPTY_PROFILE_CATALOG } from '@graphrapids/graph-autocomplete-core';

import { fetchProfileCatalog } from './catalogClient.js';

function cacheKey({ baseUrl, profileId, stage, profileVersionHint, profileChecksumHint }) {
  return `${String(baseUrl || '').replace(/\/+$/, '')}|${String(profileId || '')}|${String(stage || 'published')}|${String(
    profileVersionHint || ''
  )}|${String(profileChecksumHint || '')}`;
}

export function useProfileCatalog({
  profileId,
  profileApiBaseUrl,
  profileStage = 'published',
  profileVersionHint = null,
  profileChecksumHint = '',
  cacheRef,
  resolver = fetchProfileCatalog,
}) {
  const [warning, setWarning] = useState('');
  const [catalog, setCatalog] = useState(EMPTY_PROFILE_CATALOG);

  const key = useMemo(
    () =>
      cacheKey({
        baseUrl: profileApiBaseUrl,
        profileId,
        stage: profileStage,
        profileVersionHint,
        profileChecksumHint,
      }),
    [profileApiBaseUrl, profileChecksumHint, profileId, profileStage, profileVersionHint]
  );

  useEffect(() => {
    if (!profileId) {
      setWarning('');
      setCatalog(EMPTY_PROFILE_CATALOG);
      return;
    }

    const cache = cacheRef?.current;
    if (cache?.has(key)) {
      setCatalog(cache.get(key));
      setWarning('');
      return;
    }

    let cancelled = false;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

    (async () => {
      try {
        const nextCatalog = createProfileCatalog(
          await resolver({
            baseUrl: profileApiBaseUrl,
            profileId,
            stage: profileStage,
            profileVersion: profileVersionHint,
            signal: controller?.signal,
          })
        );

        if (cancelled) {
          return;
        }

        if (cache?.set) {
          cache.set(key, nextCatalog);
        }
        setCatalog(nextCatalog);
        setWarning('');
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Profile catalog is temporarily unavailable.';
        setWarning(`Profile catalog unavailable for '${profileId}': ${message}`);
      }
    })();

    return () => {
      cancelled = true;
      if (controller) {
        controller.abort();
      }
    };
  }, [cacheRef, key, profileApiBaseUrl, profileId, profileStage, profileVersionHint, resolver]);

  return { catalog, warning };
}

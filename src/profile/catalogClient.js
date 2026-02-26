import { createProfileCatalog } from '@graphrapids/graph-autocomplete-core';

function trimTrailingSlash(value = '') {
  return String(value || '').replace(/\/+$/, '');
}

export async function fetchProfileCatalog({
  baseUrl,
  profileId,
  stage = 'published',
  profileVersion,
  fetchImpl = globalThis.fetch,
  signal,
}) {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl);
  if (!normalizedBaseUrl) {
    throw new Error('profileApiBaseUrl is required when profileId is set.');
  }
  if (!profileId) {
    throw new Error('profileId is required.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('No fetch implementation is available for profile catalog loading.');
  }

  function buildCatalogUrl() {
    const url = new URL(`${normalizedBaseUrl}/v1/autocomplete/catalog`);
    url.searchParams.set('profile_id', profileId);
    url.searchParams.set('stage', stage);
    if (Number.isFinite(profileVersion) && Number(profileVersion) > 0) {
      url.searchParams.set('profile_version', String(Number(profileVersion)));
    }
    return url;
  }

  async function requestCatalog(url) {
    return fetchImpl(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });
  }

  const response = await requestCatalog(buildCatalogUrl());

  if (!response.ok) {
    let detail = '';
    try {
      const errorBody = await response.json();
      const errorDetail = errorBody?.detail;
      if (typeof errorDetail === 'string') {
        detail = errorDetail;
      } else if (errorDetail?.message) {
        detail = errorDetail.message;
      }
    } catch (_err) {
      // ignore JSON parse errors and use status text fallback
    }

    throw new Error(
      detail || `Failed to load profile catalog (${response.status} ${response.statusText || 'error'}).`
    );
  }

  const body = await response.json();
  return createProfileCatalog(body);
}

export interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
}

let activeRefreshPromise: Promise<RefreshResult | null> | null = null;

export async function refreshAuthToken(
  refreshToken?: string
): Promise<RefreshResult | null> {
  // Deduplicate concurrent refresh calls from MainSocket & GameSocket
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Sends httpOnly cookies automatically if used
        headers: refreshToken ? { 'Content-Type': 'application/json' } : undefined,
        body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const newAccessToken =
        data.accessToken ?? data.access_token ?? data.token ?? null;

      if (!newAccessToken) {
        return null;
      }

      return {
        accessToken: newAccessToken,
        refreshToken: data.refreshToken ?? data.refresh_token,
      };
    } catch {
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

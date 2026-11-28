let activeBridgePromise: Promise<boolean> | null = null;

export function refreshViaAuthBridge(
  onRefreshed: () => void
): Promise<boolean> {
  // Deduplicate simultaneous calls from MainSocket & GameSocket
  if (activeBridgePromise) {
    return activeBridgePromise;
  }

  activeBridgePromise = (async () => {
    try {
      const res = await fetch('/auth/bridge?callbackUrl=/', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const finalUrl = new URL(res.url, window.location.origin);

      // proxy.ts redirected to /auth/signin -> refreshToken is also expired
      if (finalUrl.pathname.startsWith('/auth/signin')) {
        const currentUrl = `${window.location.pathname}${window.location.search}`;
        window.location.replace(
          `/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`
        );
        return false;
      }

      if (!res.ok) {
        return false;
      }

      // Rotated httpOnly cookies are now set; refresh Server Component props
      onRefreshed();
      return true;
    } catch {
      return false;
    } finally {
      activeBridgePromise = null;
    }
  })();

  return activeBridgePromise;
}

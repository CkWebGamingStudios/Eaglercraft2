const CF_ACCOUNT_ID = "432016fb922777d8a5140c9b3b3d37f3";

function getIdentityApiBaseUrl() {
  const configuredProxy = import.meta.env.VITE_CF_IDENTITY_PROXY_URL;

  if (configuredProxy) {
    return configuredProxy.replace(/\/$/, "");
  }

  if (import.meta.env.DEV) {
    return "/api/cloudflare";
  }

  throw new Error(
    "Cloudflare identity lookup is not configured for production. Set VITE_CF_IDENTITY_PROXY_URL to a server-side proxy endpoint."
  );
}

export async function fetchLastSeenIdentity(userUid) {
  const trimmedUid = userUid.trim();
  if (!trimmedUid) {
    throw new Error("Please enter your Cloudflare Access UID.");
  }

  const apiBaseUrl = getIdentityApiBaseUrl();
  const requestUrl = `${apiBaseUrl}/accounts/${CF_ACCOUNT_ID}/access/users/${encodeURIComponent(trimmedUid)}/last_seen_identity`;

  try {
    const response = await fetch(requestUrl, {
      method: "GET"
    });

    const payload = await response.json();

    if (!response.ok || payload.success === false) {
      const apiError = payload?.errors?.[0]?.message || `Request failed with status ${response.status}`;
      throw new Error(apiError);
    }

    return payload.result;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Failed to fetch Cloudflare identity. This is usually a CORS/proxy issue. Configure VITE_CF_IDENTITY_PROXY_URL or use the Vite dev proxy with CF_API_TOKEN set in your environment."
      );
    }

    throw error;
  }
}

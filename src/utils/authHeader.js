const CF_ACCOUNT_ID = "432016fb922777d8a5140c9b3b3d37f3";
const DEFAULT_PROXY_BASE = "/api/cloudflare";

function getIdentityApiBaseUrl() {
  const configuredProxy = import.meta.env.VITE_CF_IDENTITY_PROXY_URL;

  if (configuredProxy) {
    return configuredProxy.replace(/\/$/, "");
  }

  return DEFAULT_PROXY_BASE;
}

function extractErrorMessage(payload, status) {
  const message = payload?.errors?.[0]?.message || payload?.message;

  if (typeof message === "string" && message.trim()) {
    return message.length > 220 ? `${message.slice(0, 220)}…` : message;
  }

  return `Request failed with status ${status}`;
}

function looksLikeHtmlDocument(body, contentType = "") {
  const normalized = body.trim().toLowerCase();
  return (
    contentType.includes("text/html") ||
    normalized.startsWith("<!doctype html") ||
    normalized.startsWith("<html")
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

    const rawBody = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (rawBody && looksLikeHtmlDocument(rawBody, contentType)) {
      throw new Error(
        "Cloudflare identity lookup hit an HTML page instead of API JSON. Configure /api/cloudflare proxy routing (or VITE_CF_IDENTITY_PROXY_URL) to forward this request server-side."
      );
    }

    let payload = null;

    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = { message: rawBody };
      }
    }

    if (!response.ok || payload?.success === false) {
      if (response.status === 404 && apiBaseUrl === DEFAULT_PROXY_BASE) {
        throw new Error(
          "Cloudflare identity proxy endpoint was not found at /api/cloudflare. Configure your host/server to proxy this route or set VITE_CF_IDENTITY_PROXY_URL."
        );
      }

      throw new Error(extractErrorMessage(payload, response.status));
    }

    if (!payload) {
      throw new Error("Cloudflare identity lookup returned an empty response from proxy.");
    }

    return payload?.result ?? payload;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Failed to fetch Cloudflare identity. This is usually a CORS/proxy issue. Ensure /api/cloudflare is proxied server-side or set VITE_CF_IDENTITY_PROXY_URL to your proxy endpoint."
      );
    }

    throw error;
  }
}

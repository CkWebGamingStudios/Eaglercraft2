const HEADER_NAME = "Cf-Access-Jwt-Assertion";
const STORAGE_KEY = "elge:cf-access-jwt-assertion";
const KV_KEY = "elge:kv:cf-access-jwt-assertion";
const COOKIE_NAME = "cf-access-jwt-assertion";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function parseHostAllowList(rawList) {
  return rawList
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function shouldRequireAccessJwt(hostname = window.location.hostname) {
  const allowList = import.meta.env.VITE_CF_ACCESS_REQUIRED_HOSTS;
  if (allowList) {
    return parseHostAllowList(allowList).includes(hostname);
  }

  return !LOCAL_HOSTS.has(hostname);
}

export async function fetchAccessJwtHeader() {
  const response = await fetch(window.location.href, {
    method: "HEAD",
    cache: "no-store",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`[ELGE AUTH] Failed header probe: ${response.status}`);
  }

  return response.headers.get(HEADER_NAME);
}

export function getStoredAccessJwt() {
  return localStorage.getItem(STORAGE_KEY);
}

export function storeAccessJwt(jwt) {
  localStorage.setItem(STORAGE_KEY, jwt);
  localStorage.setItem(KV_KEY, jwt);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(jwt)}; path=/; secure; samesite=strict`;
}

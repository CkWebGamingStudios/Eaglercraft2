const HEADER_NAME = "Cf-Access-Jwt-Assertion";
const STORAGE_KEY = "elge:cf-access-jwt-assertion";
const KV_KEY = "elge:kv:cf-access-jwt-assertion";
const COOKIE_NAME = "cf-access-jwt-assertion";

export async function fetchAccessJwtHeader() {
  const response = await fetch(window.location.href, {
    method: "HEAD",
    cache: "no-store"
  });

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

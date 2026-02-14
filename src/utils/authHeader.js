const CF_ACCOUNT_ID = "432016fb922777d8a5140c9b3b3d37f3";
const CF_ACCESS_API_TOKEN = "rVzipJyDnWRD5kGOCgKE9LTn0eWE8Wa7_-B9WHdJ";

export async function fetchLastSeenIdentity(userUid) {
  const trimmedUid = userUid.trim();
  if (!trimmedUid) {
    throw new Error("Please enter your Cloudflare Access UID.");
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/access/users/${encodeURIComponent(trimmedUid)}/last_seen_identity`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CF_ACCESS_API_TOKEN}`
      }
    }
  );

  const payload = await response.json();

  if (!response.ok || payload.success === false) {
    const apiError = payload?.errors?.[0]?.message || `Request failed with status ${response.status}`;
    throw new Error(apiError);
  }

  return payload.result;
}

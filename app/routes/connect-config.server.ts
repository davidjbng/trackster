export function requireClientCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify client ID or client secret");
  }

  return { clientId, clientSecret };
}

export function requireRedirectUrl() {
  const redirectHost = process.env.REDIRECT_HOST;
  if (!redirectHost) {
    throw new Error("Missing redirect host");
  }
  return new URL("connect-callback", redirectHost).toString();
}

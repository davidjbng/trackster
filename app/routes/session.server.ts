import type { AccessToken } from "@spotify/web-api-ts-sdk";
import { createCookieSessionStorage } from "react-router";

type SessionData = {
  token: AccessToken;
};

const secret = process.env.SPOTIFY_SESSION_SECRET;
if (!secret) {
  throw new Error("Missing Spotify session secret");
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData>({
    cookie: {
      name: "spotify-session",
      httpOnly: true,
      // lax is required for safari to handle set-cookie header on a redirect
      sameSite: "lax",
      secrets: [secret],
      secure: process.env.NODE_ENV === "production",
    },
  });

export { getSession, commitSession, destroySession };

import { createCookieSessionStorage } from "react-router";

type SessionData = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
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
      sameSite: "strict",
      secrets: [secret],
      secure: process.env.NODE_ENV === "production",
    },
  });

export { getSession, commitSession, destroySession };

import type { Route } from "./+types/connect-callback";
import { data, redirect } from "react-router";
import {
  requireClientCredentials,
  requireRedirectUrl,
} from "./connect-config.server";
import { commitSession, getSession } from "./session.server";
import { z } from "zod";

export async function loader({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.has("token")) {
    throw redirect("/");
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    const params = new URLSearchParams({
      error: url.searchParams.get("error") ?? "Missing code query param",
    });
    throw redirect(`/?${params.toString()}`);
  }

  const { clientId, clientSecret } = requireClientCredentials();
  const redirectUri = requireRedirectUrl();
  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
      Accept: "application/json",
    },
  });
  const tokenData = tokenResponseSchema.safeParse(await tokenResponse.json());
  if (!tokenData.success) {
    return data({
      status: 500,
      body: "Failed to get token",
    });
  }

  session.set("token", tokenData.data);

  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function ConnectCallback() {
  return null;
}

const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
});

import type { Route } from "./+types/connect-callback";
import { redirect } from "react-router";
import {
  requireClientCredentials,
  requireRedirectUrl,
} from "./connect-config.server";
import { commitSession, getSession } from "./session.server";
import { z } from "zod";

export async function loader({ request }: Route.ActionArgs) {
  const { clientId, clientSecret } = requireClientCredentials();
  const redirectUri = requireRedirectUrl();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
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
      }
    );
    const tokenData = tokenResponseSchema.parse(await tokenResponse.json());
    const session = await getSession(request.headers.get("Cookie"));
    session.set("accessToken", tokenData.access_token);
    session.set("refreshToken", tokenData.refresh_token);
    session.set("expiresIn", tokenData.expires_in);
    console.log("Connect session data", session.data);
    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } else if (url.searchParams.has("error")) {
    return redirect(`/?error=${url.searchParams.get("error")}`);
  }
}

const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
});

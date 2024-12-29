import type { Route } from "./+types/connect-callback";
import { redirect } from "react-router";
import {
  requireClientCredentials,
  requireRedirectUrl,
} from "./connect-config.server";

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
    const tokenData = await tokenResponse.json();
    console.log("Received token data", tokenData);
    console.log("Response", tokenResponse);
    return redirect("/");
  } else if (url.searchParams.has("error")) {
    return redirect(`/?error=${url.searchParams.get("error")}`);
  }
}

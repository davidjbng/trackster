import { redirect } from "react-router";
import {
  requireClientCredentials,
  requireRedirectUrl,
} from "./connect-config.server";

export async function loader() {
  const { clientId } = requireClientCredentials();
  const requirectUri = requireRedirectUrl();

  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", requirectUri);
  authorizeUrl.searchParams.set("scope", "playlist-read-private");

  return redirect(authorizeUrl.toString());
}

import { data } from "react-router";
import { createReadStream } from "fs";
import type { Route } from "./+types/download-qr-codes";
import { createQRCodes } from "./create-qr-codes.server";
import { getSession } from "./session.server";
import { requireClientCredentials } from "./connect-config.server";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

async function initSpotifySdkFromSession(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const { clientId } = requireClientCredentials();
  if (!session.has("token")) {
    throw new Error("User is not logged in");
  }

  return SpotifyApi.withAccessToken(clientId, session.get("token")!);
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const playlistId = url.searchParams.get("playlistId");
  if (!playlistId || typeof playlistId !== "string") {
    return data({ title: "Invalid playlist" }, { status: 400 });
  }

  console.log("Creating QR codes for playlist", playlistId);

  const sdk = await initSpotifySdkFromSession(request);
  const items = (await sdk.playlists.getPlaylistItems(playlistId)).items.map(
    (i) => ({
      href: i.track.href,
      name: i.track.name,
      artists: i.track.artists.map((a) => a.name).join(" "),
    })
  );

  const { zipFilePath } = await createQRCodes({ items });
  return data(createReadStream(zipFilePath), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="qrcodes.zip"`,
    },
  });
}

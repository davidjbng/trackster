import { data } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { createReadStream } from "fs";
import type { Route } from "./+types/download-qr-codes";
import { createQRCodes } from "./create-qr-codes.server";
import { getSession } from "./session.server";
import { requireClientCredentials } from "./connect-config.server";
import {
  SpotifyApi,
  type PlaylistedTrack,
  type Track,
} from "@spotify/web-api-ts-sdk";

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

  const sdk = await initSpotifySdkFromSession(request);
  async function* getAllPlaylistItems<TItem>(
    playlistId: string,
    selectFn: (item: PlaylistedTrack<Track>) => TItem
  ) {
    let offset = 0;
    const limit = 20;
    while (true) {
      const { items, total } = await sdk.playlists.getPlaylistItems(
        playlistId,
        undefined,
        undefined,
        limit,
        offset
      );
      yield items.map(selectFn);
      offset += items.length;
      if (offset >= total) {
        break;
      }
    }
  }
  const itemsChunks = getAllPlaylistItems(playlistId, (item) => ({
    uri: item.track.external_urls.spotify,
    name: item.track.name,
    artists: item.track.artists.map((a) => a.name).join(" "),
  }));

  const { zipFilePath } = await createQRCodes({ itemsChunks });

  return new Response(
    createReadableStreamFromReadable(createReadStream(zipFilePath)),
    {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="qr-codes.zip"`,
      },
    }
  );
}

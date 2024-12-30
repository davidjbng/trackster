import { SpotifyApi } from "@spotify/web-api-ts-sdk";

export async function createQRCodes({
  playlistId,
  sdk,
}: {
  playlistId: string;
  sdk: SpotifyApi;
}) {
  console.log("Getting playlist items for playlist", playlistId);
  const playlistItems = await sdk.playlists.getPlaylistItems(playlistId);
  console.log(
    playlistItems.items.map((i) => ({ href: i.track.href, name: i.track.name }))
  );
  
  return {};
}

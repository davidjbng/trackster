import { SpotifyApi } from "@spotify/web-api-ts-sdk";

export async function createQRCodes({
  playlistId,
  sdk,
}: {
  playlistId: string;
  sdk: SpotifyApi;
}) {
  const profile = await sdk.currentUser.profile();
  const tracks = await sdk.playlists.getPlaylistItems(playlistId);
  console.table(tracks.items);
  return {};
}

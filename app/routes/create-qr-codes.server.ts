import { SpotifyApi } from "@spotify/web-api-ts-sdk";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

export async function createQRCodes({
  playlistId,
  sdk,
}: {
  playlistId: string;
  sdk: SpotifyApi;
}) {
  // const accessToken = await getAccessToken();
  // console.log("Access token", accessToken);
  const tracks = await sdk.playlists.getPlaylistItems(playlistId);
  console.table(tracks.items);
  return {};
}

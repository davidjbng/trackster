import { SpotifyApi } from "@spotify/web-api-ts-sdk";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

export async function createQRCodes({
  playlistLink,
}: {
  playlistLink: string;
}) {
  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify client ID or secret");
  }
  const sdk = SpotifyApi.withClientCredentials(clientId, clientSecret);
  console.log("Received link", playlistLink);

  // const accessToken = await getAccessToken();
  // console.log("Access token", accessToken);
  const tracks = await getPlaylistTracks({ playlistLink, sdk });
  console.log("Tracks", tracks);
  return {};
}

// https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks
async function getPlaylistTracks({
  playlistLink,
  sdk,
}: {
  playlistLink: string;
  sdk: SpotifyApi;
}) {
  const playlistId = playlistLink.split("/").pop()?.split("?")[0];
  console.log("Playlist ID", playlistId);
  if (!playlistId) {
    throw new Error("Failed to get playlist ID");
  }
  // TODO: handle limit and offset
  // const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  const url = `https://api.spotify.com/v1/tracks/11dFghVXANMlKmJXsNCbNl`;
  const tracks = await sdk.playlists.getPlaylistItems(playlistId);

  // const response = await fetch(url, {
  //   headers: { Authorization: `Bearer ${accessToken}` },
  // });

  console.table(tracks);
  return tracks;
  // const jsonData = await response.json();
  // console.log("Playlist data", jsonData);
  // const data = tracksSchema.parse(jsonData);
  // return data.items.map((item, index) => ({
  //   position: index + 1,
  //   title: item.track.name,
  //   artist: item.track.artists.map((artist) => artist.name).join(", "),
  //   url: item.track.external_urls.spotify,
  //   year: item.track.album.release_date.split("-")[0],
  // }));
}

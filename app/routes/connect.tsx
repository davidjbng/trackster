import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { Route } from "./+types/connect";

const clientId = process.env.SPOTIFY_CLIENT_ID;

export async function loader({}: Route.LoaderArgs) {
  if (!clientId) {
    throw new Error("Missing Spotify client ID");
  }

  return { clientId };

  // const sdk = SpotifyApi.withUserAuthorization(
  //   clientId,
  //   "http://localhost:5173/authorize",
  //   ["playlist-read-private"]
  // );
  // await SpotifyApi.performUserAuthorization(
  //   clientId,
  //   "http://localhost:5173/authorize",
  //   ["playlist-read-private"],
  //   "http://localhost:5173/connect"
  // );
}

export async function action({ request }: Route.ActionArgs) {
  console.log("Received request", request);
}

export default function Connect({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>Connect to Spotify</h1>
      <button
        onClick={() => {
          console.log("Performing user authorization");
          console.log("Client ID", loaderData.clientId);

          void SpotifyApi.performUserAuthorization(
            loaderData.clientId,
            "http://localhost:5173/authorize",
            ["playlist-read-private"],
            "http://localhost:5173/connect"
          ).then((res) => console.log("Received response", res));
        }}
      >
        Connect
      </button>
    </div>
  );
}

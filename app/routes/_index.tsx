import { data, Form, Link } from "react-router";
import type { Route } from "./+types/_index";
import { getSession } from "./session.server";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { requireClientCredentials } from "./connect-config.server";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Trackster" },
    { name: "description", content: "Create your own song guessing game" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const { clientId } = requireClientCredentials();
  if (session.has("token")) {
    const sdk = SpotifyApi.withAccessToken(clientId, session.get("token")!);
    const playlists = await sdk.currentUser.playlists.playlists();
    return {
      user: await sdk.currentUser.profile(),
      playlists: playlists.items.map((p) => ({ name: p.name, id: p.id })),
    };
  }
  return { user: null };
}

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
  const { user } = loaderData;
  const [selectedPlaylist, setSelectedPlaylist] = useState(
    loaderData.playlists?.at(0)?.id
  );

  return (
    <main className="h-full">
      <div className="grid place-items-center h-full">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl">Welcome to Trackster</h1>
          {user ? (
            <div className="flex gap-3 items-center">
              <p className="text-green-500">
                You are logged in as {user.display_name}
              </p>
              <Link to="/logout" className="px-3 py-2 bg-red-500/60 rounded-lg">
                Logout
              </Link>
            </div>
          ) : (
            <Link to="/connect" className="text-blue-500">
              Connect Your Spotify Account
            </Link>
          )}
        </div>
        <div className="flex flex-col gap-3 self-start">
          <Form className="flex flex-col gap-3">
            <label htmlFor="playlist">Select your Spotify playlist</label>
            <select
              disabled={!loaderData.user}
              id="playlist"
              name="playlistId"
              className="rounded-md px-4 py-3"
              required
              onChange={(e) => setSelectedPlaylist(e.target.value)}
            >
              {loaderData.playlists?.map((playlist, index) => (
                <option
                  selected={index === 0}
                  key={playlist.id}
                  value={playlist.id}
                  label={playlist.name}
                />
              ))}
            </select>
          </Form>
          {selectedPlaylist && (
            <Link
              to={`/download-qr-codes?playlistId=${selectedPlaylist}`}
              className="bg-green-700 rounded-lg px-4 py-3 mt-4 hover:bg-green-800"
              reloadDocument
              download
            >
              QR Codes ready! Click here to download
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

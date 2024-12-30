import { data, Form, Link } from "react-router";
import type { Route } from "./+types/_index";
import { createQRCodes } from "./create-qr-codes.server";
import { getSession } from "./session.server";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { requireClientCredentials } from "./connect-config.server";

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
      isLoggedIn: true,
      playlists: playlists.items.map((p) => ({ name: p.name, id: p.id })),
    };
  }
  return { isLoggedIn: false };
}

async function initSpotifySdkFromSession(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const { clientId } = requireClientCredentials();
  if (!session.has("token")) {
    throw new Error("User is not logged in");
  }

  return SpotifyApi.withAccessToken(clientId, session.get("token")!);
}

export async function action({ request }: Route.ActionArgs) {
  console.log("Creating QR codes for playlist", request.url);
  const formData = await request.formData();
  const playlistId = formData.get("playlistId");
  if (!playlistId || typeof playlistId !== "string") {
    return data({ title: "Invalid playlist" }, { status: 400 });
  }

  const sdk = await initSpotifySdkFromSession(request);
  const qrCodes = await createQRCodes({ playlistId, sdk });
  return null;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { isLoggedIn } = loaderData;
  return (
    <main className="h-full">
      <div className="grid place-items-center h-full">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl">Welcome to Trackster</h1>
          {isLoggedIn ? (
            <div className="flex gap-3 items-center">
              <p className="text-green-500">You are connected to Spotify</p>
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
        <Form className="flex flex-col self-start gap-3" method="post">
          <label htmlFor="playlist">Select your Spotify playlist</label>
          <input
            disabled={!loaderData.isLoggedIn}
            id="playlist"
            name="playlistId"
            type="text"
            placeholder="Your playlist"
            className="rounded-md px-4 py-3"
            required
            list="playlists"
          />
          <datalist id="playlists">
            {loaderData.playlists?.map((playlist) => (
              <option key={playlist.id} value={playlist.name} />
            ))}
          </datalist>
          <button
            disabled={!loaderData.isLoggedIn}
            type="submit"
            className="bg-green-700 rounded-lg px-4 py-3 mt-4 hover:bg-green-800"
          >
            Download QR Codes
          </button>
        </Form>
      </div>
    </main>
  );
}

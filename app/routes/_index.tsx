import { data, Form, Link } from "react-router";
import type { Route } from "./+types/_index";
import { createQRCodes } from "./create-qr-codes.server";
import { getSession } from "./session.server";
import { SpotifyApi, ClientCredentialsStrategy } from "@spotify/web-api-ts-sdk";
import { requireClientCredentials } from "./connect-config.server";
import { createReadStream } from "node:fs";

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

async function initSpotifySdkFromSession(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const { clientId } = requireClientCredentials();
  if (!session.has("token")) {
    throw new Error("User is not logged in");
  }

  return SpotifyApi.withAccessToken(clientId, session.get("token")!);
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const playlistId = formData.get("playlistId");
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

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
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
        <Form className="flex flex-col self-start gap-3" method="post">
          <label htmlFor="playlist">Select your Spotify playlist</label>
          <select
            disabled={!loaderData.user}
            id="playlist"
            name="playlistId"
            className="rounded-md px-4 py-3"
            required
          >
            {loaderData.playlists?.map((playlist) => (
              <option
                key={playlist.id}
                value={playlist.id}
                label={playlist.name}
              />
            ))}
          </select>
          <button
            disabled={!loaderData.user}
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

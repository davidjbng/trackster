import { data, Form, Link } from "react-router";
import type { Route } from "./+types/_index";
import { createQRCodes } from "./create-qr-codes.server";
import { getSession } from "./session.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Trackster" },
    { name: "description", content: "Create your own song guessing game" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  console.log("Loader Session data", session.data);
  if (session.get("accessToken")) {
    return { isLoggedIn: true };
  }
  return { isLoggedIn: false };
}

export async function action({ request }: Route.ActionArgs) {
  const playlistLink = new URL(request.url).searchParams.get("playlistLink");
  const matches = playlistLink?.match(playlistLinkPattern);
  if (!matches || !playlistLink) {
    return data({ title: "Invalid playlist link" }, { status: 400 });
  }

  const qrCodes = await createQRCodes({ playlistLink });
  return null;
}

const playlistLinkPattern = "https://open.spotify.com/playlist/[a-zA-Z0-9?=]+";

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="h-full">
      <div className="grid place-items-center h-full">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl">Welcome to Trackster</h1>
          <pre>{JSON.stringify(loaderData, null, 3)}</pre>
          <Link to="connect" className="text-blue-500">
            Connect Your Spotify Account
          </Link>
        </div>
        <Form className="flex flex-col self-start gap-3" method="post">
          <label htmlFor="playlistLink">
            Enter a link to your Spotify playlist
          </label>
          <input
            id="playlistLink"
            type="text"
            placeholder="Your playlist"
            name="playlistLink"
            className="rounded-md px-4 py-3"
            required
            // TODO: remove defaultValue
            defaultValue={
              "https://open.spotify.com/playlist/37i9dQZF1E8PF82uJv4bH4?si=cde9e5b42d824684"
            }
            pattern={playlistLinkPattern}
            title="Please enter a valid Spotify playlist link like https://open.spotify.com/playlist/37i9dQZF1DWZy48MuOV69W"
          />
          <button
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

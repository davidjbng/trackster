import { data, Form } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Trackster" },
    { name: "description", content: "Create your own song guessing game" },
  ];
}

export function action({ request }: Route.ActionArgs) {
  const playlistLink = new URL(request.url).searchParams.get("playlistLink");
  const matches = playlistLink?.match(playlistLinkPattern);
  if (!matches) {
    return data({ title: "Invalid playlist link" }, { status: 400 });
  }

  console.log("Received link", playlistLink);
  return null;
}

const playlistLinkPattern = "https://open.spotify.com/playlist/[a-zA-Z0-9?=]+";

export default function Home() {
  return (
    <main className="h-full">
      <div className="grid place-items-center h-full">
        <h1 className="text-5xl">Welcome to Trackster</h1>
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

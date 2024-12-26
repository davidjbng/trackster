import { Form } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Trackster" },
    { name: "description", content: "Create your own song guessing game" },
  ];
}

export default function Home() {
  return (
    <main className="h-full">
      <div className="grid place-items-center h-full">
        <h1 className="text-5xl">Welcome to Trackster</h1>
        <Form className="flex flex-col self-start gap-3">
          <label htmlFor="playlistLink">
            Enter a link to your Spotify playlist
          </label>
          <input
            id="playlistLink"
            type="text"
            placeholder="Your playlist"
            name="playlistLink"
            className="rounded-md px-4 py-3"
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

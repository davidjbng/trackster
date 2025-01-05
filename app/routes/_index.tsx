import { Form, Link } from "react-router";
import type { Route } from "./+types/_index";
import { getSession } from "./session.server";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { requireClientCredentials } from "./connect-config.server";
import { initSpotifySdkFromSession } from "./download-qr-codes";

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
    const audiobookAlbums = await sdk.search("Hörbücher", ["album"]);

    return {
      user: await sdk.currentUser.profile(),
      audiobooks: audiobookAlbums.albums.items.map((album) => ({
        name: album.name,
        imageUrl: album.images.at(0)?.url,
        id: album.id,
      })),
      devices: (await sdk.player.getAvailableDevices()).devices,
    };
  }
  return { user: null };
}

export async function action({ request }: Route.ActionArgs) {
  const sdk = await initSpotifySdkFromSession(request);
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, audiobooks, devices } = loaderData;

  return (
    <main className="h-full px-2">
      <header className="flex gap-3 items-center p-1">
        <h1 className="text-lg flex-1">Hörbücher auf Spotify</h1>
        {user ? (
          <div className="flex gap-3 items-center">
            <select
              className="max-w-fit p-2 rounded-lg"
              defaultValue={devices?.find((d) => d.is_active)?.id ?? undefined}
            >
              {devices?.map((device) => (
                <option key={device.id} value={device.id ?? ""}>
                  {device.name}
                </option>
              ))}
            </select>
            <Link to="/logout" className="flex gap-0.5 items-center">
              <p>{user.display_name}</p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                />
              </svg>
            </Link>
          </div>
        ) : (
          <Link to="/connect" className="text-blue-500">
            Login
          </Link>
        )}
      </header>
      <div className="grid place-items-center h-full">
        {/* <pre>{JSON.stringify(devices, null, 3)}</pre> */}
        <ul className="grid sm:grid-cols-3 grid-cols-2 gap-x-4 gap-y-6 mt-8">
          {audiobooks?.map((audio) => (
            <li key={audio.name} className="flex flex-col gap-1">
              <img src={audio.imageUrl} alt={audio.name} />
              <Form>
                <button className="bg-green-700 rounded-lg px-2 py-1 max-h-fit">
                  Play
                </button>
              </Form>
              <p className="line-clamp-3 flex-1">{audio.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

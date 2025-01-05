import { Link } from "react-router";
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
        {/* <pre>{JSON.stringify(devices, null, 3)}</pre> */}
        <select
          className="w-full p-2 rounded-lg"
          defaultValue={devices?.find((d) => d.is_active)?.id ?? undefined}
        >
          {devices?.map((device) => (
            <option key={device.id} value={device.id ?? ""}>
              {device.name}
            </option>
          ))}
        </select>
        <ul className="grid grid-cols-3 gap-x-4 gap-y-6 mt-8">
          {audiobooks?.map((audio) => (
            <li key={audio.name} className="flex flex-col gap-1">
              <img src={audio.imageUrl} alt={audio.name} />
              <button className="bg-green-700 rounded-lg px-2 py-1 max-h-fit">
                Play
              </button>
              <p className="line-clamp-3 flex-1">{audio.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

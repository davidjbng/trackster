import { data, Form, Link } from "react-router";
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
      audiobooksAlbums: audiobookAlbums.albums.items.map((album) => ({
        name: album.name,
        imageUrl: album.images.at(0)?.url,
        id: album.id,
      })),
      devices: (await sdk.player.getAvailableDevices()).devices,
      playbackState: await sdk.player.getPlaybackState(),
    };
  }
  return { user: null };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const albumId = formData.get("albumId");
  if (!albumId || typeof albumId !== "string") {
    return data({ error: "No albumId provided" }, { status: 400 });
  }

  const sdk = await initSpotifySdkFromSession(request);
  const devices = (await sdk.player.getAvailableDevices()).devices;

  const device = devices.find((d) => d.is_active) ?? devices.at(0);
  if (!device?.id) {
    throw new Error("No active device found");
  }
  const album = await sdk.albums.get(albumId);
  const track = album.tracks.items.at(0);
  if (!track) {
    throw new Error("No tracks found in album");
  }

  sdk.player.startResumePlayback(device.id, `spotify:album:${albumId}`);

  return data({ success: true });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, audiobooksAlbums, devices, playbackState } = loaderData;

  return (
    <main className="h-full px-2">
      <header className="flex gap-3 items-center px-1 py-2">
        <h1 className="text-lg flex-1">Hörbücher auf Spotify</h1>
        {user ? (
          <div className="flex gap-3 items-center">
            <div className="relative flex">
              <button aria-hidden className="mt-auto">
                <svg
                  width="59"
                  height="50"
                  viewBox="0 0 59 50"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-6"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M9.93571 49.2968H14.6116V44.3786H7.3592V49.2968H9.93571ZM58.6032 6.71246C58.6032 3.40953 55.8359 0.732666 52.3051 0.732666H28.2576C24.7268 0.732666 21.9595 3.40953 21.9595 6.71246V43.2716C21.9595 46.5745 24.7268 49.2514 28.2576 49.2514H52.3051C55.8359 49.2514 58.6032 46.5745 58.6032 43.2716V6.71246ZM53.4502 6.71246V43.2716C53.4502 43.8614 52.9731 44.3422 52.3051 44.3422H28.2576C27.5896 44.3422 27.1125 43.8614 27.1125 43.2716V6.71246C27.1125 6.12265 27.5896 5.64166 28.2576 5.64166H52.3051C52.9731 5.64166 53.4502 6.12265 53.4502 6.71246ZM40.2813 25.0783C44.3847 25.0783 47.6292 28.2178 47.6292 32.0923C47.6292 35.9669 44.3847 39.1157 40.2813 39.1157C36.178 39.1157 32.9335 35.9669 32.9335 32.0923C32.9335 28.2178 36.178 25.0783 40.2813 25.0783ZM12.0351 0.732666H6.50036C2.96958 0.732666 0.202209 3.39138 0.202209 6.66709V29.2794C0.202209 32.5551 2.96958 35.2138 6.50036 35.2138H14.6116V30.3048H6.50036C5.83237 30.3048 5.35524 29.842 5.35524 29.2794V6.66709C5.35524 6.1045 5.83237 5.64166 6.50036 5.64166H14.6116V0.732666H12.0351ZM40.2813 10.9409C42.2853 10.9409 44.003 12.5107 44.003 14.4434C44.003 16.3853 42.2853 17.9552 40.2813 17.9552C38.2774 17.9552 36.5597 16.3853 36.5597 14.4434C36.5597 12.5107 38.2774 10.9409 40.2813 10.9409Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <select
                className="absolute inset-0 opacity-0 w-full h-full"
                defaultValue={
                  devices?.find((d) => d.is_active)?.id ?? undefined
                }
              >
                {devices?.map((device) => (
                  <option key={device.id} value={device.id ?? ""}>
                    {device.name}
                  </option>
                ))}
              </select>
            </div>
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
      <pre>{JSON.stringify(playbackState?.item.id, null, 3)}</pre>
      <div className="grid place-items-center h-full">
        <ul className="grid sm:grid-cols-3 grid-cols-2 gap-x-4 gap-y-6 mt-8">
          {audiobooksAlbums?.map((audio) => {
            return (
              <li key={audio.name} className="flex flex-col gap-1">
                <img src={audio.imageUrl} alt={audio.name} />
                <Form method="post">
                  <button
                    className="bg-green-700 rounded-lg px-2 py-1 max-h-fit"
                    name="albumId"
                    value={audio.id}
                  >
                    Play
                  </button>
                </Form>
                <p className="line-clamp-3 flex-1">{audio.name}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

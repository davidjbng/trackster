import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { destroySession, getSession } from "./session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

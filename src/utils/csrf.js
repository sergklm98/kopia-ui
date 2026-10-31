import axios from "axios";

export async function bootstrapCSRFToken() {
  const response = await fetch("/api/v1/csrf", {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`CSRF bootstrap failed with HTTP ${response.status}`);
  }

  const body = await response.json();
  if (typeof body?.token !== "string" || body.token.length === 0) {
    throw new Error("CSRF bootstrap returned no token");
  }

  axios.defaults.headers.common["X-Kopia-Csrf-Token"] = body.token;
  return body.token;
}

import axios from "axios";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { bootstrapCSRFToken } from "../../src/utils/csrf";

describe("CSRF bootstrap", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    delete axios.defaults.headers.common["X-Kopia-Csrf-Token"];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("fetches a same-origin token and installs it on API requests", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "csrf-token" }),
    });

    await expect(bootstrapCSRFToken()).resolves.toBe("csrf-token");

    expect(fetch).toHaveBeenCalledWith("/api/v1/csrf", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    });
    expect(axios.defaults.headers.common["X-Kopia-Csrf-Token"]).toBe("csrf-token");
  });

  test("reports failed bootstrap responses without installing a token", async () => {
    fetch.mockResolvedValue({ ok: false, status: 401 });

    await expect(bootstrapCSRFToken()).rejects.toThrow("CSRF bootstrap failed with HTTP 401");
    expect(axios.defaults.headers.common["X-Kopia-Csrf-Token"]).toBeUndefined();
  });

  test("rejects a successful response without a token", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(bootstrapCSRFToken()).rejects.toThrow("CSRF bootstrap returned no token");
  });
});

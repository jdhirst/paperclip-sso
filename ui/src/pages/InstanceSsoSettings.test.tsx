// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstanceSsoSettings } from "./InstanceSsoSettings";

const mockInstanceSettingsApi = vi.hoisted(() => ({
  getSso: vi.fn(),
  updateSso: vi.fn(),
}));

vi.mock("@/api/instanceSettings", () => ({
  instanceSettingsApi: mockInstanceSettingsApi,
}));

vi.mock("../context/BreadcrumbContext", () => ({
  useBreadcrumbs: () => ({
    setBreadcrumbs: vi.fn(),
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

async function flushReact() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  });
}

describe("InstanceSsoSettings", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    mockInstanceSettingsApi.getSso.mockResolvedValue({ enabled: true, providers: [] });
  });

  afterEach(async () => {
    if (root) {
      const mounted = root;
      await act(async () => {
        mounted.unmount();
      });
      root = null;
    }
    container.remove();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("describes first-login company access the way the server grants it", async () => {
    root = createRoot(container);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await act(async () => {
      root!.render(
        <QueryClientProvider client={queryClient}>
          <InstanceSsoSettings />
        </QueryClientProvider>,
      );
    });
    await flushReact();
    await flushReact();

    // The server does not auto-provision SSO users into companies (see doc/SSO.md),
    // so the settings page must not promise it.
    expect(container.textContent).toContain("Important Notes");
    expect(container.textContent).not.toMatch(/automatically (added|provisioned)|all existing companies/i);
    expect(container.textContent).toContain("start with no company memberships");
  });
});

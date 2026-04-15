import { getServerEnv, getClientEnv } from "../lib/env";
import DashboardClient from "./_components/dashboard-client";

export const dynamic = "force-dynamic";

async function loadInitialItems() {
  const { apiProxyTarget } = getServerEnv();

  try {
    const response = await fetch(`${apiProxyTarget}/items`, { cache: "no-store" });
    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const initialItems = await loadInitialItems();
  const { appName } = getClientEnv();

  return <DashboardClient initialItems={initialItems} appName={appName} />;
}

import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

export async function fetchJson(path: string, init?: RequestInit) {
  const token = await SecureStore.getItemAsync("app_token");
  const base = (Constants.expoConfig?.extra as any)?.BFF_URL;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(init?.headers || {})
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

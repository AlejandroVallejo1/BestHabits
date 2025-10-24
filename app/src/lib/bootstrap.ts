import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

export async function ensureToken() {
  const existing = await SecureStore.getItemAsync("app_token");
  if (existing) return existing;
  const base = (Constants.expoConfig?.extra as any)?.BFF_URL;
  const res = await fetch(`${base}/bootstrap`, { method: "POST" });
  const data = await res.json();
  await SecureStore.setItemAsync("app_token", data.token);
  return data.token;
}

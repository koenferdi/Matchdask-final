export type GrokProvider = {
  providerId: string;
  idp: string;
  label: string;
};

export const GROK_PROVIDERS: readonly GrokProvider[] = [
  { providerId: "grok-google", idp: "google", label: "Google" },
  { providerId: "grok-x", idp: "twitter", label: "X" },
];

const GOOGLE_ONLY: readonly GrokProvider[] = [{ providerId: "google", idp: "google", label: "Google" }];

function useNativeGoogle(): boolean {
  const viteFlag =
    typeof import.meta !== "undefined" &&
    Boolean((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_NATIVE_GOOGLE === "true");
  const envFlag =
    typeof process !== "undefined" &&
    (process.env.VITE_NATIVE_GOOGLE === "true" || process.env.MATCHDESK_VPS === "1");
  return viteFlag || envFlag;
}

/** Sign-in buttons: native Google on the VPS, Grok-broker otherwise. */
export const LOGIN_PROVIDERS: readonly GrokProvider[] = useNativeGoogle() ? GOOGLE_ONLY : GROK_PROVIDERS;

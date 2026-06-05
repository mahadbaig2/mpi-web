export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function isGoogleOAuthConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      typeof data?.error?.message === "string"
        ? data.error.message
        : "Failed to fetch Google profile";
    throw new Error(message);
  }

  if (!data.email) {
    throw new Error("Google account did not return an email address. Try another account.");
  }

  return {
    email: data.email,
    name: data.name || data.email.split("@")[0],
    picture: data.picture,
  };
}

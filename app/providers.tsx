"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import { GOOGLE_CLIENT_ID, isGoogleOAuthConfigured } from "@/lib/google-auth";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const content = <AuthProvider>{children}</AuthProvider>;

  if (!isGoogleOAuthConfigured()) {
    return content;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  );
}

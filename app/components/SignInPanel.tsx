"use client";

import { useState } from "react";
import { AuthPanel } from "./AuthPanel";
import { signInAsGuest, startGoogleSignIn } from "@/lib/auth";
import { type Player } from "@/lib/game";
import { getSupabaseClient } from "@/lib/supabase";

type SignInPanelProps = {
  title: React.ReactNode;
  description: string;
  onCancel: () => void;
  /** Misafir girişi bitince çağrılır. Google girişi sayfadan ayrılıp `redirectTo` adresine döner. */
  onSignedIn: (player: Player) => void;
  /** Verilmezse Google girişinden aynı sayfaya dönülür. */
  redirectTo?: string;
};

/** Düello ve oda gibi girişin kendi akışı olan ekranlar için giriş adımı: Google ya da misafir. */
export function SignInPanel({ title, description, onCancel, onSignedIn, redirectTo }: SignInPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  return (
    <AuthPanel
      authError={error}
      choiceLabel=""
      description={description}
      isSigningIn={isSigningIn}
      onCancel={onCancel}
      onGoogleSignIn={async () => {
        setIsSigningIn(true);
        setError(null);
        const message = await startGoogleSignIn(redirectTo ?? window.location.href);
        if (message) {
          setError(message);
          setIsSigningIn(false);
        }
      }}
      onGuestSignIn={async (name) => {
        setIsSigningIn(true);
        setError(null);
        const result = await signInAsGuest(name);
        setIsSigningIn(false);
        if ("error" in result) return setError(result.error);
        onSignedIn(result.player);
      }}
      supabaseConfigured={getSupabaseClient() !== null}
      title={title}
    />
  );
}

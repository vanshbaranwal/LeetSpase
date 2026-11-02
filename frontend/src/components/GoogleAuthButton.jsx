import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../store/useAuthStore";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

let googleScriptPromise;

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google Identity Services failed to load")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error("Google Identity Services failed to load"));

    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

const GoogleAuthButton = () => {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const isGoogleLoggingIn = useAuthStore(
    (state) => state.isGoogleLoggingIn,
  );
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (!clientId) {
      return undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (!isMounted || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            if (!credential) return;

            const success = await googleLogin(credential);

            if (success) {
              navigate("/problems", { replace: true });
            }
          },
        });

        buttonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline_dark",
          size: "medium",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: Math.min(buttonRef.current.clientWidth || 320, 320),
        });
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setLoadError("Could not load Google login");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clientId, googleLogin, navigate]);

  const configurationError = clientId ? loadError : "Google login is not configured yet";

  if (configurationError) {
    return (
      <button
        type="button"
        className="mx-auto flex h-10 w-full max-w-80 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/[0.025] px-4 text-sm text-white/35"
        disabled
        title={configurationError}
      >
        {configurationError}
      </button>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-10 w-full max-w-80 items-center justify-center overflow-hidden rounded-full">
      <div
        ref={buttonRef}
        className="flex min-h-10 w-full items-center justify-center overflow-hidden rounded-full [&>div]:!mx-auto"
      />

      {isGoogleLoggingIn && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full border border-white/10 bg-[#131314]/95"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2 text-sm">Signing in with Google...</span>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;

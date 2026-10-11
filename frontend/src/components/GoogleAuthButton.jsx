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
          theme: "filled_blue",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: Math.min(buttonRef.current.clientWidth || 400, 400),
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
        className="btn btn-outline w-full"
        disabled
        title={configurationError}
      >
        {configurationError}
      </button>
    );
  }

  return (
    <div className="relative flex min-h-11 w-full justify-center">
      <div ref={buttonRef} className="flex w-full justify-center" />

      {isGoogleLoggingIn && (
        <div className="absolute inset-0 flex items-center justify-center rounded bg-base-100/90">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">Signing in with Google...</span>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;

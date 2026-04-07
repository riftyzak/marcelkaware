"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready?: (callback: () => void) => void;
      execute?: (siteKey: string, options: { action: string }) => Promise<string>;
      enterprise?: {
        ready?: (callback: () => void) => void;
        execute?: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

function getRecaptchaApi() {
  if (typeof window === "undefined" || !window.grecaptcha) {
    return null;
  }

  if (
    typeof window.grecaptcha.ready === "function" &&
    typeof window.grecaptcha.execute === "function"
  ) {
    return {
      ready: window.grecaptcha.ready.bind(window.grecaptcha),
      execute: window.grecaptcha.execute.bind(window.grecaptcha),
    };
  }

  if (
    typeof window.grecaptcha.enterprise?.ready === "function" &&
    typeof window.grecaptcha.enterprise?.execute === "function"
  ) {
    return {
      ready: window.grecaptcha.enterprise.ready.bind(window.grecaptcha.enterprise),
      execute: window.grecaptcha.enterprise.execute.bind(window.grecaptcha.enterprise),
    };
  }

  return null;
}

function hideRecaptchaBadge() {
  if (typeof document === "undefined") {
    return;
  }

  const badge = document.querySelector<HTMLElement>(".grecaptcha-badge");
  if (!badge) {
    return;
  }

  badge.style.visibility = "hidden";
  badge.style.opacity = "0";
  badge.style.pointerEvents = "none";
}

export function useRecaptchaV3() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const retryRef = useRef<number | null>(null);

  const available = Boolean(siteKey) && !failed;

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    hideRecaptchaBadge();

    const observer = new MutationObserver(() => {
      hideRecaptchaBadge();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  const markReady = useCallback(() => {
    const api = getRecaptchaApi();
    if (api) {
      hideRecaptchaBadge();
      setLoaded(true);
      return;
    }

    if (retryRef.current !== null) {
      window.clearTimeout(retryRef.current);
    }

    retryRef.current = window.setTimeout(markReady, 120);
  }, []);

  const script = useMemo(() => {
    if (!siteKey) {
      return null;
    }

    return (
      <Script
        id="google-recaptcha-v3"
        onError={() => setFailed(true)}
        onLoad={markReady}
        src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
        strategy="afterInteractive"
      />
    );
  }, [markReady, siteKey]);

  const execute = useCallback(
    async (action: string) => {
      if (!siteKey) {
        throw new Error("Security verification is unavailable.");
      }

      const api = getRecaptchaApi();
      if (!api) {
        throw new Error("Security verification is unavailable.");
      }

      const token = await new Promise<string>((resolve, reject) => {
        api.ready(async () => {
          try {
            const value = await api.execute(siteKey, { action });
            resolve(value);
          } catch (error) {
            reject(error);
          }
        });
      });

      return token;
    },
    [siteKey],
  );

  return {
    available,
    loaded,
    execute,
    script,
  };
}

"use client";
import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import "./cookieconsent-theme.css";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag(...args: unknown[]): void;
  }
}

const GA_ID = "G-967G7G06G8";

function loadGA(id: string) {
  if (document.getElementById("ga-script")) return;
  const s = document.createElement("script");
  s.id = "ga-script";
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  s.async = true;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id);
}

export default function CookieConsentBanner() {
  useEffect(() => {
    CookieConsent.run({
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: {},
      },
      language: {
        default: "en",
        translations: {
          en: {
            consentModal: {
              title: "Cookies & Privacy",
              description:
                'We use Google Analytics to understand how visitors use soheads. See our <a href="/privacy">Privacy Policy</a>.',
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Essential only",
              showPreferencesBtn: "Preferences",
            },
            preferencesModal: {
              title: "Cookie Preferences",
              acceptAllBtn: "Accept all",
              acceptNecessaryBtn: "Essential only",
              savePreferencesBtn: "Save",
              sections: [
                {
                  title: "Essential",
                  description:
                    "Required for the site to function. Cannot be disabled.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analytics (Google Analytics)",
                  description:
                    "Helps us understand how visitors use the site. Data is anonymised.",
                  linkedCategory: "analytics",
                },
              ],
            },
          },
        },
      },
      onConsent: () => {
        if (GA_ID && CookieConsent.acceptedCategory("analytics")) {
          loadGA(GA_ID);
        }
      },
      onChange: () => {
        if (GA_ID && CookieConsent.acceptedCategory("analytics")) {
          loadGA(GA_ID);
        }
      },
    });
  }, []);

  return null;
}

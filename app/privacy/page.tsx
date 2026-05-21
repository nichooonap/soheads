export const metadata = {
  title: "Privacy Policy — soheads",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2025</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
        <section>
          <h2 className="mb-2 font-semibold text-foreground">What we collect</h2>
          <p>
            soheads does not collect any personal data. We do not ask for your name,
            email address, or any account information.
          </p>
          <p className="mt-2">
            When you build or vote on a squad, a random anonymous ID is generated and
            stored in your browser&apos;s local storage. This ID has no link to your identity
            — it exists only to prevent duplicate votes. It is never shared with third parties.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">Squad data</h2>
          <p>
            Squads you create (name, formation, player selection) are stored on our servers
            and are publicly visible. Do not include personal information in squad names.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">Player & card data</h2>
          <p>
            Player names, photos, and card images are sourced from the Sorare API. soheads
            is not affiliated with Sorare. Player data is cached to reduce API load and
            improve performance.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">Cookies & Analytics</h2>
          <p>
            The anonymous squad/vote ID uses{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">localStorage</code>,
            not a cookie.
          </p>
          <p className="mt-2">
            With your consent, we use Google Analytics (Google Ireland Limited, Gordon House,
            Barrow Street, Dublin 4, Ireland) to understand how visitors use the site. Google
            Analytics sets cookies to collect anonymised usage data. If you decline, no analytics
            cookies are set. You can change your preference at any time via the "Cookies" link in
            the footer. Legal basis: Art. 6(1)(a) GDPR (consent).
          </p>
          <p className="mt-2">
            For more information, see{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              Google&apos;s privacy policy
            </a>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">Infrastructure</h2>
          <p>
            soheads is hosted on Vercel (USA) and uses Supabase for data storage (EU region).
            Both are GDPR-compliant processors.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">Your rights</h2>
          <p>
            Since we hold no personal data linked to you, there is nothing to access,
            correct, or delete. If you have questions, contact us at{" "}
            <a href="mailto:yo@nichooo.com" className="underline underline-offset-2">
              yo@nichooo.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Terms of Use — soheads",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Use</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2025</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
        <section>
          <h2 className="mb-2 font-semibold text-foreground">About soheads</h2>
          <p>
            soheads is a free, community-driven squad builder for Sorare. It is an
            independent fan project and is <strong>not affiliated with, endorsed by,
            or connected to Sorare SAS</strong> in any way. Sorare is a trademark of
            Sorare SAS.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">Use of the service</h2>
          <p>
            soheads is provided free of charge for personal, non-commercial use. You may
            use it to build, share, and discover Sorare squads. You may not:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Use the service for any unlawful purpose</li>
            <li>Submit squad names that are offensive, abusive, or infringing</li>
            <li>Scrape or systematically extract data from the platform</li>
            <li>Attempt to interfere with or disrupt the service</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">User content</h2>
          <p>
            Squad names and configurations you submit are public. By submitting content
            you confirm it does not infringe any third-party rights. We reserve the right
            to remove any content at our discretion.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">Player & card data</h2>
          <p>
            Player names, images, and card artwork are the property of Sorare and their
            respective rights holders. They are displayed here for informational and
            community purposes only, in accordance with Sorare&apos;s publicly available API.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">No financial advice</h2>
          <p>
            Nothing on soheads constitutes financial or investment advice. Sorare cards
            are digital assets whose value may go up or down.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">Disclaimer</h2>
          <p>
            The service is provided &quot;as is&quot; without warranty of any kind. We are not
            liable for any damages arising from your use of soheads.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">Changes</h2>
          <p>
            We may update these terms at any time. Continued use of the service after
            changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-foreground">Contact</h2>
          <p>
            Questions?{" "}
            <a href="mailto:nichonap@gmail.com" className="underline underline-offset-2">
              nichonap@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

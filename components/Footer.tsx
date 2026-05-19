// simple footer

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} soheads</span>
          <a href="/terms" className="hover:text-foreground">
            Terms
          </a>
          <a href="/privacy" className="hover:text-foreground">
            Privacy
          </a>
          <span className="text-[11px]">
            Not affiliated with Sorare.
          </span>
        </div>
        <a
          href="https://sorare.com/r/nichonap"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          Join Sorare
        </a>
      </div>
    </footer>
  );
}

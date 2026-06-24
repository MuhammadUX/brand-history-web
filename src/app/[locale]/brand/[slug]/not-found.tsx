import Link from "next/link";

// Brand not-found. Next.js does not pass route params to not-found components,
// so this renders bilingual copy and links default to the English locale.
export default function BrandNotFound() {
  return (
    <div className="mx-auto flex max-w-container flex-col items-center justify-center px-4 py-24 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-card bg-primary-tint text-2xl text-primary"
        aria-hidden="true"
      >
        ?
      </span>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink">
        Brand not found
      </h1>
      <p className="mt-1 text-lg text-secondary" dir="rtl">
        العلامة غير موجودة
      </p>
      <p className="mt-3 max-w-md text-secondary">
        We couldn&rsquo;t find the brand you were looking for. Try searching, or
        discover and suggest brands below.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/en/search"
          className="rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Search brands
        </Link>
        <Link
          href="/en/discover"
          className="rounded-btn border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Discover brands
        </Link>
        <Link
          href="/en/suggest"
          className="rounded-btn border border-border bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-page focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Suggest this brand
        </Link>
      </div>
      <Link
        href="/en"
        className="mt-6 text-sm text-secondary underline-offset-2 hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}

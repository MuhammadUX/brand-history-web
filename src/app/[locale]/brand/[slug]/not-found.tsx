import { StateBlock, Button } from "@/components/ui";

// Brand not-found. Next.js does not pass route params to not-found components,
// so this renders bilingual copy and links default to the English locale.
export default function BrandNotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-content px-6 py-20"
    >
      <StateBlock
        state="empty"
        icon="🔎"
        title={
          <>
            Brand not found
            <span className="font-arabic mt-1 block text-[15px] font-normal text-muted">
              العلامة غير موجودة
            </span>
          </>
        }
        message="We couldn’t find the brand you were looking for. Try searching, or discover and suggest brands below."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Button href="/en/search" variant="primary" size="sm">
              Search brands
            </Button>
            <Button href="/en/discover" variant="ghost" size="sm">
              Discover brands
            </Button>
            <Button href="/en/suggest" variant="ghost" size="sm">
              Suggest this brand
            </Button>
          </div>
        }
      />
      <div className="mt-6 text-center">
        <a
          href="/en"
          className="text-[13px] font-semibold text-link hover:underline"
        >
          Back to home
        </a>
      </div>
    </main>
  );
}

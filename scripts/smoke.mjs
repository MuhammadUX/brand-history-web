// Smoke test: verify the public (anon, RLS-protected) read path returns published brands.
// Run: node scripts/smoke.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://osivlxbygjdluzuckvpo.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zaXZseGJ5Z2pkbHV6dWNrdnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTE5NjQsImV4cCI6MjA5NzgyNzk2NH0.ldGSInsBFa3-PTOdD33AjU9DMIQKXnouL1xkxiQH6c4";

const supabase = createClient(url, key, { auth: { persistSession: false } });

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
}

const { data: brands, error } = await supabase
  .from("brands")
  .select("slug,name_en,name_ar,is_verified, sector:sectors(name_en)")
  .order("download_count", { ascending: false });

check("brands query returns no error", !error);
check("at least 6 published brands", (brands?.length ?? 0) >= 6);
check("stc present", !!brands?.find((b) => b.slug === "stc"));
check("bilingual names present", brands?.every((b) => b.name_en && b.name_ar));

const { data: stc } = await supabase
  .from("brands")
  .select("slug, assets:brand_assets(asset_type), colors:brand_colors(hex), timeline:timeline_entries(year)")
  .eq("slug", "stc")
  .single();

check("stc has assets", (stc?.assets?.length ?? 0) > 0);
check("stc has colors", (stc?.colors?.length ?? 0) > 0);
check("stc has timeline", (stc?.timeline?.length ?? 0) > 0);

console.log(failures === 0 ? "\nALL SMOKE CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);

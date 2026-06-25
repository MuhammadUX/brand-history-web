/**
 * DraftNotice — amber "DRAFT — pending legal review" banner shared by the
 * Privacy and Terms template pages. The Library look: warm amber hairline.
 */
export function DraftNotice({
  label,
  body,
  updated,
}: {
  label: string;
  body: string;
  updated: string;
}) {
  return (
    <div
      role="note"
      className="mt-6 rounded-lg border border-amber-line bg-amber-bg px-4 py-3.5"
    >
      <p className="text-[12px] font-bold uppercase tracking-label text-amber">
        {label}
      </p>
      <p className="mt-1.5 text-[13px] leading-6 text-ink">{body}</p>
      <p className="mt-1.5 text-[12px] text-muted">{updated}</p>
    </div>
  );
}

export default DraftNotice;

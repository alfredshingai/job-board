export default function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-white">Prev</button>
      <span className="text-sm text-zinc-600">Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-white">Next</button>
    </div>
  );
}

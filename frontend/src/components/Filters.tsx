type FiltersProps = {
  values: {
    q: string;
    location: string;
    workplace: string;
    tags: string;
    sort: string;
    salaryMin: string;
    salaryMax: string;
  };
  onChange: (patch: Partial<FiltersProps['values']>) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export default function Filters({ values, onChange, onSubmit, onReset }: FiltersProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-600">Keyword</span>
          <input value={values.q} onChange={(e) => onChange({ q: e.target.value })} placeholder="react, nimbus, backend" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-600">Location</span>
          <input value={values.location} onChange={(e) => onChange({ location: e.target.value })} placeholder="Berlin, Remote" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-600">Workplace</span>
          <select value={values.workplace} onChange={(e) => onChange({ workplace: e.target.value })} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm bg-white">
            <option value="">Any</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-600">Tags (comma-separated)</span>
          <input value={values.tags} onChange={(e) => onChange({ tags: e.target.value })} placeholder="react, typescript" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-600">Salary min</span>
          <input inputMode="numeric" value={values.salaryMin} onChange={(e) => onChange({ salaryMin: e.target.value })} placeholder="80000" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-600">Salary max</span>
          <input inputMode="numeric" value={values.salaryMax} onChange={(e) => onChange({ salaryMax: e.target.value })} placeholder="150000" className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-zinc-600">Sort</span>
          <select value={values.sort} onChange={(e) => onChange({ sort: e.target.value })} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm bg-white">
            <option value="newest">Newest</option>
            <option value="salary_high">Highest salary</option>
            <option value="salary_low">Lowest salary</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onReset} className="rounded-full border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50">Reset</button>
          <button type="submit" className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800">Search</button>
        </div>
      </div>
    </form>
  );
}

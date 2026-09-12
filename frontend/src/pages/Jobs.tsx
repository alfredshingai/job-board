import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Job, Paginated } from '../api/types';
import JobCard from '../components/JobCard';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';

function useQueryState() {
  const [params, setParams] = useSearchParams();
  const values = {
    q: params.get('q') ?? '',
    location: params.get('location') ?? '',
    workplace: params.get('workplace') ?? '',
    tags: params.get('tags') ?? '',
    sort: params.get('sort') ?? 'newest',
    salaryMin: params.get('salaryMin') ?? '',
    salaryMax: params.get('salaryMax') ?? '',
    page: params.get('page') ?? '1',
  };
  const patch = (next: Partial<typeof values> | Record<string, string>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    if (!('page' in next)) p.set('page', '1');
    setParams(p, { replace: true });
  };
  return { values, patch, params };
}

export default function Jobs() {
  const { values, patch, params } = useQueryState();
  const [local, setLocal] = useState(values);
  const [data, setData] = useState<Paginated<Job> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // keep local filters in sync when URL changes via pagination/tag clicks
  useEffect(() => setLocal(values), [params]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (values.q) qs.set('q', values.q);
    if (values.location) qs.set('location', values.location);
    if (values.workplace) qs.set('workplace', values.workplace);
    if (values.tags) qs.set('tags', values.tags);
    if (values.sort) qs.set('sort', values.sort);
    if (values.salaryMin) qs.set('salaryMin', values.salaryMin);
    if (values.salaryMax) qs.set('salaryMax', values.salaryMax);
    qs.set('page', values.page);
    qs.set('pageSize', '12');

    api
      .get<Paginated<Job>>(`/api/jobs?${qs.toString()}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [values.q, values.location, values.workplace, values.tags, values.sort, values.salaryMin, values.salaryMax, values.page]);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Job board</h1>
        {data && <span className="text-sm text-zinc-600">{data.meta.total} roles</span>}
      </div>

      <Filters
        values={local}
        onChange={(p) => setLocal((s) => ({ ...s, ...p }))}
        onSubmit={() => patch({ ...local, page: '1' })}
        onReset={() => {
          const empty = { q: '', location: '', workplace: '', tags: '', sort: 'newest', salaryMin: '', salaryMax: '', page: '1' };
          setLocal(empty);
          patch(empty);
        }}
      />

      {loading && <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">Loading jobs…</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {data && !loading && (
        <>
          {data.data.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">No jobs match your filters. Try clearing tags or salary range.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.data.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          )}
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPage={(p) => patch({ page: String(p) })} />
        </>
      )}
    </div>
  );
}

create table if not exists public.user_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  file_name text not null,
  file_risk text not null check (file_risk in ('None', 'Low', 'Medium', 'High', 'Critical')),
  findings_count integer not null default 0 check (findings_count >= 0),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.scan_findings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  detector_type text not null check (detector_type in ('email', 'phone', 'nino', 'card')),
  risk text not null check (risk in ('Low', 'Medium', 'High', 'Critical')),
  occurrence_count integer not null check (occurrence_count > 0),
  masked_example text not null,
  created_at timestamptz not null default now(),
  unique (scan_id, detector_type),
  constraint scan_findings_scan_owner_fkey
    foreign key (scan_id, user_id)
    references public.user_scans (id, user_id)
    on delete cascade
);

create index if not exists user_scans_owner_created_idx
  on public.user_scans (user_id, created_at desc);

create index if not exists scan_findings_owner_scan_idx
  on public.scan_findings (user_id, scan_id);

alter table public.user_scans enable row level security;
alter table public.scan_findings enable row level security;

grant select, insert, delete on public.user_scans to authenticated;
grant select, insert, delete on public.scan_findings to authenticated;

drop policy if exists "Users can read their own scans" on public.user_scans;
create policy "Users can read their own scans"
  on public.user_scans for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own scans" on public.user_scans;
create policy "Users can create their own scans"
  on public.user_scans for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own scans" on public.user_scans;
create policy "Users can delete their own scans"
  on public.user_scans for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own findings" on public.scan_findings;
create policy "Users can read their own findings"
  on public.scan_findings for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own findings" on public.scan_findings;
create policy "Users can create their own findings"
  on public.scan_findings for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own findings" on public.scan_findings;
create policy "Users can delete their own findings"
  on public.scan_findings for delete to authenticated
  using ((select auth.uid()) = user_id);

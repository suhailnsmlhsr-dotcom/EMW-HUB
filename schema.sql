-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run

create extension if not exists "pgcrypto";

create table documents (
  id uuid primary key default gen_random_uuid(),
  doc_number text unique not null,          -- e.g. INV-0001
  doc_type text not null check (doc_type in ('invoice','receipt')),
  linked_invoice_id uuid references documents(id) on delete set null,
  linked_invoice_number text,               -- shown on receipt for reference

  client_name text not null,
  client_course text,
  date_issued date not null,

  work_items jsonb not null default '[]',   -- [{workId, description, dateAssigned, amount}]
  total numeric not null default 0,

  -- receipt-only payment fields
  amount_paid numeric,
  balance_due numeric,
  cash_amount numeric,
  upi_amount numeric,
  bank_amount numeric,
  payment_method text,                      -- Cash / UPI / Bank / Mixed
  payment_date date,

  status text not null default 'draft',     -- draft | sent | partial | paid
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_documents_type on documents(doc_type);
create index idx_documents_linked on documents(linked_invoice_id);

-- Public can read everything (needed so anyone can view/print without login).
-- All writes (insert/update/delete) go through the server API using the
-- service role key, which bypasses RLS — the API itself checks the login
-- session before allowing a write, so the database never trusts the client directly.
alter table documents enable row level security;

create policy "Public read access"
  on documents for select
  using (true);

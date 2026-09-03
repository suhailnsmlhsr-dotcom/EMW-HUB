-- Run this in Supabase SQL Editor to add the missing column
-- (needed for the "Download File Name" feature).

alter table documents add column if not exists file_label text;

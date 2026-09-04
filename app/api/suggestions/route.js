import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const db = supabaseServer();
  const { data, error } = await db.from('documents').select('client_name, client_course, work_items');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const names = new Set();
  const courses = new Set();
  const descriptions = new Set();

  for (const row of data) {
    if (row.client_name) names.add(row.client_name.trim());
    if (row.client_course) courses.add(row.client_course.trim());
    if (Array.isArray(row.work_items)) {
      for (const item of row.work_items) {
        if (item && item.description) descriptions.add(String(item.description).trim());
      }
    }
  }

  return NextResponse.json({
    clientNames: Array.from(names).sort(),
    courses: Array.from(courses).sort(),
    descriptions: Array.from(descriptions).sort(),
  });
}

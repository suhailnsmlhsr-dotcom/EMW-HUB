export async function nextDocNumber(db, prefix) {
  const { data, error } = await db.from('documents').select('doc_number');
  if (error) throw new Error(error.message);

  let max = 0;
  for (const row of data) {
    const match = /(?:INV|RCP)-(\d+)/.exec(row.doc_number || '');
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  const next = String(max + 1).padStart(4, '0');
  return `${prefix}-${next}`;
}

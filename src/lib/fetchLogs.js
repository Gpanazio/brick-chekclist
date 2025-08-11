export async function fetchLogs({ supabase }) {
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('data_exportacao', { ascending: false })

  if (error) throw error
  return data || []
}

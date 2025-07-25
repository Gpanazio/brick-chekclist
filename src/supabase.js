import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ujpvyslrosmismgbcczl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqcHZ5c2xyb3NtaXNtZ2JjY3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NzU5MDgsImV4cCI6MjA2NjM1MTkwOH0.XkgwQ4VF7_7plt8-cw9VsatX4WwLolZEO6a6YtovUFs'

export const supabase = createClient(supabaseUrl, supabaseKey)

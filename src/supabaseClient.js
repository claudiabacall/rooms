import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://farqloirhvykcuiomwxg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhcnFsb2lyaHZ5a2N1aW9td3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA3NTUzNCwiZXhwIjoyMDYzNjUxNTM0fQ.-CriqNczXet52rrnQPQ5SaFx7F8Zw0b2lc0k4eMjD4k';

export const supabase = createClient(supabaseUrl, supabaseKey);

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
export const SUPABASE_URL = 'https://nvrjdmhgginfywmdpxtb.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cmpkbWhnZ2luZnl3bWRweHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTgwNjAsImV4cCI6MjA3MzE3NDA2MH0.TrtPEe9YXawMzPx1MgpGhDoYPdxDbSxseTZHEC-lZn8';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

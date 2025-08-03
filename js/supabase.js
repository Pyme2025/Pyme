// Initialize Supabase client
const { createClient } = supabase;
const supabaseUrl = 'https://nyzlexsevgdwxgsarsfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55emxleHNldmdkd3hnc2Fyc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0OTA2NTEsImV4cCI6MjA2OTA2NjY1MX0.ZOKdhOvtaalHNOYTUDAGy4aO65tJ50L0VQcJk1Vl_Co';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to get user role
async function getUserRole(userId) {
    const { data, error } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId)
        .single();
    return error ? null : data.roles.name;
}

// Function to log audit actions
async function logAudit(userId, action, details, ip = 'unknown') {
    const { error } = await supabase
        .from('audit_logs')
        .insert([{ user_id: userId, action, details: JSON.stringify(details), ip_address: ip }]);
    if (error) console.error('Audit log error:', error);
}

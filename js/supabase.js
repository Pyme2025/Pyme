const supabase = supabase.createClient(
    'https://nyzlexsevgdwxgsarsfm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55emxleHNldmdkd3hnc2Fyc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0OTA2NTEsImV4cCI6MjA2OTA2NjY1MX0.ZOKdhOvtaalHNOYTUDAGy4aO65tJ50L0VQcJk1Vl_Co'
);

// Función para obtener el rol del usuario
async function getUserRole(userId) {
    const { data, error } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId)
        .single();
    return error ? null : data.roles.name;
}

// Función para registrar auditoría
async function logAudit(userId, action, details, ip) {
    const { error } = await supabase
        .from('audit_logs')
        .insert([{ user_id: userId, action, details, ip_address: ip }]);
    if (error) console.error('Error en auditoría:', error);
}
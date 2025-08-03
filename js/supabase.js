// Asegura que Supabase esté disponible globalmente
const { createClient } = supabase; // Asume que el CDN carga 'supabase' globalmente
const supabaseUrl = 'https://nyzlexsevgdwxgsarsfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55emxleHNldmdkd3hnc2Fyc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0OTA2NTEsImV4cCI6MjA2OTA2NjY1MX0.ZOKdhOvtaalHNOYTUDAGy4aO65tJ50L0VQcJk1Vl_Co';

// Inicializa el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para obtener el rol del usuario
async function getUserRole(userId) {
    try {
        const { data, error } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', userId)
            .single();
        if (error) throw error;
        return data?.roles?.name || null;
    } catch (error) {
        console.error('Error al obtener rol:', error.message);
        return null;
    }
}

// Función para registrar auditoría
async function logAudit(userId, action, details, ip = 'unknown') {
    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert([{ user_id: userId, action, details: JSON.stringify(details), ip_address: ip }]);
        if (error) throw error;
    } catch (error) {
        console.error('Error en auditoría:', error.message);
    }
}

// Exporta supabase globalmente para otros scripts
window.supabase = supabase;

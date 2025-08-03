document.addEventListener('DOMContentLoaded', () => {
    const errorMessage = document.getElementById('errorMessage');
    const loginForm = document.getElementById('loginForm');

    if (!window.supabase) {
        errorMessage.textContent = 'Error: No se pudo conectar con el servidor. Por favor, intenta de nuevo.';
        console.error('Supabase no está definido. Verifica que supabase.js se cargue correctamente.');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Verificar si el usuario está en pending_users
            const { data: pendingUser, error: pendingError } = await supabase
                .from('pending_users')
                .select('status')
                .eq('email', email)
                .single();
            if (pendingError && pendingError.code !== 'PGRST116') {
                throw new Error('Error al verificar estado: ' + pendingError.message);
            }
            if (pendingUser && pendingUser.status === 'pending') {
                errorMessage.textContent = 'Tu cuenta está pendiente de aprobación por Recursos Humanos.';
                return;
            }

            // Intentar iniciar sesión
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw new Error(error.message);

            // Verificar si el usuario existe en la tabla users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();
            if (userError || !userData) {
                errorMessage.textContent = 'Usuario no encontrado. Por favor, regístrate.';
                return;
            }

            // Registrar auditoría
            await logAudit(data.user.id, 'login', { email }, 'unknown');

            // Establecer timeout de sesión
            sessionStorage.setItem('lastActivity', Date.now());
            window.location.href = '/Pyme/dashboard.html';
        } catch (error) {
            errorMessage.textContent = 'Error al iniciar sesión: ' + error.message;
            console.error('Error en login:', error);
        }
    });

    document.getElementById('forgotPassword').addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        if (!email) {
            errorMessage.textContent = 'Por favor, ingresa tu correo.';
            return;
        }
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'https://pyme2025.github.io/Pyme/reset-password.html'
            });
            if (error) throw error;
            errorMessage.textContent = 'Se ha enviado un enlace de restablecimiento a tu correo.';
        } catch (error) {
            errorMessage.textContent = 'Error al enviar el enlace: ' + error.message;
            console.error('Error en restablecimiento:', error);
        }
    });

    // Timeout de sesión (15 minutos)
    setInterval(() => {
        const lastActivity = sessionStorage.getItem('lastActivity');
        if (lastActivity && (Date.now() - lastActivity) > 15 * 60 * 1000) {
            supabase.auth.signOut();
            window.location.href = '/Pyme/login.html';
        }
    }, 60000);
});

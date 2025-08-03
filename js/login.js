document.addEventListener('DOMContentLoaded', () => {
    const errorMessage = document.getElementById('errorMessage');
    const loginForm = document.getElementById('loginForm');

    // Verificar que Supabase esté definido
    if (!window.supabase || typeof window.supabase.from !== 'function') {
        errorMessage.textContent = 'Error: No se pudo conectar con el servidor. Por favor, recarga la página.';
        console.error('Supabase no está definido o .from no es una función. Verifica el CDN y supabase.js.');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            console.log('Intentando verificar usuario en pending_users...');
            // Verificar si el usuario está en pending_users
            const { data: pendingUser, error: pendingError } = await window.supabase
                .from('pending_users')
                .select('status')
                .eq('email', email)
                .single();
            if (pendingError && pendingError.code !== 'PGRST116') {
                console.error('Error al verificar pending_users:', pendingError);
                throw new Error('Error al verificar estado: ' + pendingError.message);
            }
            if (pendingUser && pendingUser.status === 'pending') {
                errorMessage.textContent = 'Tu cuenta está pendiente de aprobación por Recursos Humanos.';
                return;
            }

            console.log('Intentando iniciar sesión con Supabase Auth...');
            // Intentar iniciar sesión
            const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
            if (error) {
                console.error('Error en signInWithPassword:', error);
                throw new Error(error.message);
            }

            console.log('Verificando usuario en la tabla users...');
            // Verificar si el usuario existe en la tabla users
            const { data: userData, error: userError } = await window.supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();
            if (userError || !userData) {
                console.error('Error en consulta a users:', userError);
                errorMessage.textContent = 'Usuario no encontrado. Por favor, regístrate.';
                return;
            }

            console.log('Registrando auditoría de login...');
            // Registrar auditoría
            await logAudit(data.user.id, 'login', { email }, 'unknown');

            // Establecer timeout de sesión
            sessionStorage.setItem('lastActivity', Date.now());
            console.log('Redirigiendo a dashboard...');
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
            console.log('Solicitando restablecimiento de contraseña...');
            const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'https://pyme2025.github.io/Pyme/reset-password.html'
            });
            if (error) {
                console.error('Error en resetPasswordForEmail:', error);
                throw error;
            }
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
            console.log('Sesión expirada, cerrando sesión...');
            window.supabase.auth.signOut();
            window.location.href = '/Pyme/login.html';
        }
    }, 60000);
});

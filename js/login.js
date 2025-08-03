document.addEventListener('DOMContentLoaded', () => {
    const errorMessage = document.getElementById('errorMessage');
    const loginForm = document.getElementById('loginForm');

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Check if user exists in pending_users
            const { data: pendingUser, error: pendingError } = await supabase
                .from('pending_users')
                .select('status')
                .eq('email', email)
                .single();

            if (pendingUser && pendingUser.status === 'pending') {
                errorMessage.textContent = 'Tu cuenta está pendiente de aprobación por Recursos Humanos.';
                return;
            }

            // Attempt login with Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw new Error(error.message);

            // Check if user exists in users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();
            if (userError || !userData) {
                errorMessage.textContent = 'Usuario no encontrado. Por favor, regístrate.';
                return;
            }

            // Log audit
            await logAudit(data.user.id, 'login', { email }, 'unknown');

            // Set session timeout
            sessionStorage.setItem('lastActivity', Date.now());
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorMessage.textContent = 'Error al iniciar sesión: ' + error.message;
        }
    });

    // Handle forgot password
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
        }
    });

    // Session timeout (15 minutes)
    setInterval(() => {
        const lastActivity = sessionStorage.getItem('lastActivity');
        if (lastActivity && (Date.now() - lastActivity) > 15 * 60 * 1000) {
            supabase.auth.signOut();
            window.location.href = 'login.html';
        }
    }, 60000);
});

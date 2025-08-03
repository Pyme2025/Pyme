document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Verificar que Supabase esté definido
    if (!window.supabase || typeof window.supabase.auth !== 'object') {
        errorMessage.textContent = 'Error: No se pudo conectar con el servidor. Por favor, recarga la página.';
        console.error('Supabase no está definido o .auth no es un objeto. Verifica el CDN y supabase.js.');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            console.log('Iniciando sesión para:', email);
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Error de autenticación:', error);
                throw new Error('Credenciales inválidas');
            }

            console.log('Usuario autenticado:', data.user.email);
            const role = await getUserRole(data.user.id);
            if (!role) {
                console.warn('No se encontró rol para el usuario:', data.user.id);
                throw new Error('No tienes un rol asignado. Contacta a Recursos Humanos.');
            }

            console.log('Rol del usuario:', role);
            await logAudit(data.user.id, 'login', { email, role }, 'unknown');
            window.location.href = '/Pyme/dashboard.html';
        } catch (error) {
            errorMessage.textContent = 'Error al iniciar sesión: ' + error.message;
            console.error('Error en login:', error);
        }
    });
});

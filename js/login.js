document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert('Error al iniciar sesión: ' + error.message);
    } else {
        sessionStorage.setItem('lastActivity', Date.now());
        window.location.href = 'dashboard.html';
    }
});

// Timeout de 15 minutos
setInterval(() => {
    const lastActivity = sessionStorage.getItem('lastActivity');
    if (lastActivity && (Date.now() - lastActivity) > 15 * 60 * 1000) {
        supabase.auth.signOut();
        window.location.href = 'login.html';
    }
}, 60000);
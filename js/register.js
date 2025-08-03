document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const last_name = document.getElementById('last_name').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const birthdate = document.getElementById('birthdate').value;
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;
    const selfie = document.getElementById('selfie').files[0];

    if (password !== confirm_password) {
        alert('Las contraseñas no coinciden');
        return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        alert('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
        return;
    }

    let selfie_url = null;
    if (selfie) {
        const { data, error } = await supabase.storage
            .from('selfies')
            .upload(`${email}_selfie.jpg`, selfie);
        if (error) {
            alert('Error al subir selfie: ' + error.message);
            return;
        }
        selfie_url = `https://nyzlexsevgdwxgsarsfm.supabase.co/storage/v1/object/public/selfies/${data.path}`;
    }

    const { error } = await supabase.from('pending_users').insert([{
        name,
        last_name,
        username,
        email,
        birthdate,
        password_hash: password, // En producción, usar hash
        selfie_url
    }]);
    if (error) {
        alert('Error al registrar: ' + error.message);
    } else {
        alert('Registro enviado. Espera aprobación de Recursos Humanos.');
        window.location.href = 'login.html';
    }
});
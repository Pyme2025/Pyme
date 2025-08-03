document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');

    if (!window.supabase) {
        errorMessage.textContent = 'Error: No se pudo conectar con el servidor. Por favor, intenta de nuevo.';
        console.error('Supabase no está definido. Verifica que supabase.js se cargue correctamente.');
        return;
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const name = document.getElementById('name').value;
        const last_name = document.getElementById('last_name').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const birthdate = document.getElementById('birthdate').value;
        const password = document.getElementById('password').value;
        const confirm_password = document.getElementById('confirm_password').value;
        const selfie = document.getElementById('selfie').files[0];

        // Validar contraseña
        if (password !== confirm_password) {
            errorMessage.textContent = 'Las contraseñas no coinciden';
            return;
        }
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            errorMessage.textContent = 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número';
            return;
        }

        try {
            // Verificar si el email o usuario ya existe
            const { data: existingUser, error: userError } = await supabase
                .from('pending_users')
                .select('email, username')
                .or(`email.eq.${email},username.eq.${username}`)
                .single();
            if (userError && userError.code !== 'PGRST116') { // PGRST116 indica que no se encontraron resultados
                throw new Error('Error al verificar usuario: ' + userError.message);
            }
            if (existingUser) {
                errorMessage.textContent = 'El correo o usuario ya está registrado';
                return;
            }

            let selfie_url = null;
            if (selfie) {
                const fileName = `${email}_${Date.now()}.jpg`;
                const { data, error: uploadError } = await supabase.storage
                    .from('selfies')
                    .upload(fileName, selfie, { contentType: 'image/jpeg' });
                if (uploadError) throw new Error('Error al subir selfie: ' + uploadError.message);
                selfie_url = `${supabaseUrl}/storage/v1/object/public/selfies/${fileName}`;
            }

            // Insertar en pending_users
            const { error: insertError } = await supabase
                .from('pending_users')
                .insert([{
                    name,
                    last_name,
                    username,
                    email,
                    birthdate,
                    password_hash: password, // En producción, usar hash seguro
                    selfie_url,
                    status: 'pending'
                }]);
            if (insertError) throw new Error('Error al registrar: ' + insertError.message);

            // Registrar auditoría
            await logAudit(null, 'register_attempt', { email, username }, 'unknown');

            errorMessage.textContent = 'Registro enviado. Espera aprobación de Recursos Humanos.';
            setTimeout(() => window.location.href = '/Pyme/login.html', 2000);
        } catch (error) {
            errorMessage.textContent = 'Error: ' + error.message;
            console.error('Error en registro:', error);
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const selfieInput = document.getElementById('selfie');

    // Verificar que Supabase esté definido
    if (!window.supabase || typeof window.supabase.from !== 'function') {
        errorMessage.textContent = 'Error: No se pudo conectar con el servidor. Por favor, recarga la página.';
        console.error('Supabase no está definido o .from no es una función. Verifica el CDN y supabase.js.');
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
        const selfie = selfieInput.files[0];

        try {
            console.log('Registrando usuario:', email);

            // Validar datos
            if (!name || !last_name || !username || !email || !birthdate || !password) {
                throw new Error('Todos los campos son obligatorios');
            }

            // Subir selfie si existe
            let selfie_url = null;
            if (selfie) {
                console.log('Subiendo selfie...');
                const fileExt = selfie.name.split('.').pop();
                const fileName = `${Date.now()}_${username}.${fileExt}`;
                const { data, error: uploadError } = await window.supabase.storage
                    .from('selfies')
                    .upload(fileName, selfie);
                if (uploadError) {
                    console.error('Error al subir selfie:', uploadError);
                    throw new Error('Error al subir la selfie: ' + uploadError.message);
                }
                selfie_url = `${supabaseUrl}/storage/v1/object/public/selfies/${fileName}`;
                console.log('Selfie subida:', selfie_url);
            }

            // Insertar en pending_users
            console.log('Insertando en pending_users...');
            const { error: insertError } = await window.supabase
                .from('pending_users')
                .insert([{
                    name,
                    last_name,
                    username,
                    email,
                    birthdate,
                    password_hash: password, // Texto plano para pruebas
                    selfie_url,
                    status: 'pending'
                }]);
            if (insertError) {
                console.error('Error al insertar en pending_users:', insertError);
                throw new Error('Error al registrar usuario: ' + insertError.message);
            }

            console.log('Usuario registrado en pending_users:', email);
            errorMessage.textContent = 'Registro exitoso. Espera la aprobación de Recursos Humanos.';
            errorMessage.style.color = 'green';
            registerForm.reset();
        } catch (error) {
            errorMessage.textContent = 'Error: ' + error.message;
            console.error('Error en registro:', error);
        }
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    const errorMessage = document.getElementById('errorMessage');
    const pendingUsersDiv = document.getElementById('pending-users');

    // Verificar que Supabase esté definido
    if (!window.supabase || typeof window.supabase.from !== 'function') {
        errorMessage.textContent = 'Error: No se pudo conectar con el servidor. Por favor, recarga la página.';
        console.error('Supabase no está definido o .from no es una función. Verifica el CDN y supabase.js.');
        return;
    }

    // Verificar sesión y rol
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    if (authError || !user) {
        errorMessage.textContent = 'Por favor, inicia sesión.';
        console.error('Error de autenticación:', authError);
        window.location.href = '/Pyme/login.html';
        return;
    }

    console.log('Usuario autenticado:', user.email);
    const role = await getUserRole(user.id);
    if (!['Recursos Humanos', 'Administrador', 'Superusuario'].includes(role)) {
        errorMessage.textContent = 'No tienes permiso para acceder a esta página.';
        console.error('Rol no autorizado:', role);
        return;
    }

    // Mostrar información del usuario
    document.getElementById('user-name').textContent = user.email;
    const { data: userData, error: userError } = await window.supabase
        .from('users')
        .select('name, selfie_url')
        .eq('id', user.id)
        .single();
    if (!userError && userData) {
        console.log('Datos del usuario:', userData);
        document.getElementById('user-name').textContent = userData.name;
        if (userData.selfie_url) {
            document.getElementById('user-selfie').src = userData.selfie_url;
        }
    } else {
        console.error('Error al obtener datos del usuario:', userError);
    }

    // Cargar usuarios pendientes
    console.log('Cargando usuarios pendientes...');
    const { data: pendingUsers, error: pendingError } = await window.supabase
        .from('pending_users')
        .select('id, name, last_name, email, username, birthdate, selfie_url, status')
        .eq('status', 'pending');
    if (pendingError) {
        errorMessage.textContent = 'Error al cargar usuarios pendientes: ' + pendingError.message;
        console.error('Error al cargar pending_users:', pendingError);
        return;
    }

    if (pendingUsers.length === 0) {
        pendingUsersDiv.innerHTML = '<p>No hay usuarios pendientes de aprobación.</p>';
        return;
    }

    pendingUsersDiv.innerHTML = pendingUsers.map(user => `
        <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
            <p><strong>Nombre:</strong> ${user.name} ${user.last_name}</p>
            <p><strong>Correo:</strong> ${user.email}</p>
            <p><strong>Usuario:</strong> ${user.username}</p>
            <p><strong>Fecha de Nacimiento:</strong> ${user.birthdate}</p>
            ${user.selfie_url ? `<p><strong>Selfie:</strong><br><img src="${user.selfie_url}" style="max-width: 100px; border-radius: 10px;"></p>` : '<p>No hay selfie disponible.</p>'}
            <label for="role-${user.id}">Asignar Rol:</label>
            <select id="role-${user.id}">
                <option value="">Seleccionar Rol</option>
                <option value="Técnico">Técnico</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Administrador">Administrador</option>
                <option value="Superusuario">Superusuario</option>
            </select>
            <button onclick="approveUser(${user.id}, '${user.email}', '${user.password_hash}')">Aprobar</button>
            <button onclick="rejectUser(${user.id})">Rechazar</button>
        </div>
    `).join('');

    // Botón de cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        console.log('Cerrando sesión...');
        await window.supabase.auth.signOut();
        window.location.href = '/Pyme/login.html';
    });
});

// Función para aprobar usuario
async function approveUser(id, email, password_hash) {
    const errorMessage = document.getElementById('errorMessage');
    const roleSelect = document.getElementById(`role-${id}`);
    const role = roleSelect ? roleSelect.value : '';

    if (!role) {
        errorMessage.textContent = 'Por favor, selecciona un rol.';
        console.error('No se seleccionó un rol para el usuario:', email);
        return;
    }

    try {
        console.log(`Aprobando usuario ${email} con rol ${role}...`);
        // Crear usuario en Supabase Auth
        const { data: authUser, error: authError } = await window.supabase.auth.admin.createUser({
            email,
            password: password_hash, // En producción, usar hash seguro
            email_confirm: true
        });
        if (authError) {
            console.error('Error al crear usuario en Auth:', authError);
            throw new Error('Error al crear usuario en Auth: ' + authError.message);
        }

        // Obtener datos del usuario pendiente
        const { data: pendingUser, error: pendingError } = await window.supabase
            .from('pending_users')
            .select('*')
            .eq('id', id)
            .single();
        if (pendingError) {
            console.error('Error al obtener pending_user:', pendingError);
            throw new Error('Error al obtener usuario pendiente: ' + pendingError.message);
        }

        // Transferir a tabla users
        console.log('Insertando usuario en la tabla users...');
        const { error: insertError } = await window.supabase
            .from('users')
            .insert([{
                id: authUser.user.id,
                email: pendingUser.email,
                username: pendingUser.username,
                name: pendingUser.name,
                last_name: pendingUser.last_name,
                birthdate: pendingUser.birthdate,
                selfie_url: pendingUser.selfie_url
            }]);
        if (insertError) {
            console.error('Error al insertar en users:', insertError);
            throw new Error('Error al transferir usuario: ' + insertError.message);
        }

        // Obtener ID del rol
        console.log('Asignando rol:', role);
        const { data: roleData, error: roleError } = await window.supabase
            .from('roles')
            .select('id')
            .eq('name', role)
            .single();
        if (roleError || !roleData) {
            console.error('Error al obtener rol:', roleError);
            throw new Error('Error al obtener rol: ' + (roleError?.message || 'Rol no encontrado'));
        }

        // Asignar rol
        const { error: roleInsertError } = await window.supabase
            .from('user_roles')
            .insert([{ user_id: authUser.user.id, role_id: roleData.id }]);
        if (roleInsertError) {
            console.error('Error al asignar rol:', roleInsertError);
            throw new Error('Error al asignar rol: ' + roleInsertError.message);
        }

        // Actualizar estado a aprobado
        console.log('Actualizando estado a approved...');
        const { error: updateError } = await window.supabase
            .from('pending_users')
            .update({ status: 'approved' })
            .eq('id', id);
        if (updateError) {
            console.error('Error al actualizar pending_users:', updateError);
            throw new Error('Error al actualizar estado: ' + updateError.message);
        }

        // Registrar auditoría
        const { data: { user } } = await window.supabase.auth.getUser();
        await logAudit(user.id, 'approve_user', { pending_user_id: id, email, role }, 'unknown');
        console.log('Usuario aprobado exitosamente:', email);

        errorMessage.textContent = `Usuario ${email} aprobado exitosamente.`;
        setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
        errorMessage.textContent = 'Error al aprobar usuario: ' + error.message;
        console.error('Error al aprobar usuario:', error);
    }
}

// Función para rechazar usuario
async function rejectUser(id) {
    const errorMessage = document.getElementById('errorMessage');

    try {
        console.log(`Rechazando usuario con ID ${id}...`);
        const { error } = await window.supabase
            .from('pending_users')
            .update({ status: 'rejected' })
            .eq('id', id);
        if (error) {
            console.error('Error al rechazar usuario:', error);
            throw new Error('Error al rechazar usuario: ' + error.message);
        }

        // Registrar auditoría
        const { data: { user } } = await window.supabase.auth.getUser();
        await logAudit(user.id, 'reject_user', { pending_user_id: id }, 'unknown');
        console.log('Usuario rechazado exitosamente:', id);

        errorMessage.textContent = 'Usuario rechazado exitosamente.';
        setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
        errorMessage.textContent = 'Error al rechazar usuario: ' + error.message;
        console.error('Error al rechazar usuario:', error);
    }
}

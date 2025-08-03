document.addEventListener('DOMContentLoaded', async () => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('user-info').textContent = `Usuario: ${user.data.user.email}`;

    document.getElementById('startBtn').addEventListener('click', async () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const gps = `${position.coords.latitude},${position.coords.longitude}`;
                const { error } = await supabase
                    .from('services')
                    .update({ start_time: new Date().toISOString(), gps_location: gps })
                    .eq('id', document.getElementById('service_id').value)
                    .eq('technician_id', user.data.user.id);
                if (error) alert('Error al registrar llegada: ' + error.message);
                else alert('Llegada registrada');
            });
        }
    });

    document.getElementById('fieldServiceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const evidence = document.getElementById('evidence').files[0];
        let evidence_url = null;

        if (evidence) {
            const { data, error } = await supabase.storage
                .from('evidencias')
                .upload(`${user.data.user.id}_${Date.now()}.jpg`, evidence);
            if (error) {
                alert('Error al subir evidencia: ' + error.message);
                return;
            }
            evidence_url = `https://nyzlexsevgdwxgsarsfm.supabase.co/storage/v1/object/public/evidencias/${data.path}`;
        }

        const updates = {
            customer_name: document.getElementById('customer_name').value,
            error_reported: document.getElementById('error_reported').value,
            status: document.getElementById('status').value,
            end_time: document.getElementById('status').value === 'completado' ? new Date().toISOString() : null
        };

        const { error } = await supabase
            .from('services')
            .update(updates)
            .eq('id', document.getElementById('service_id').value)
            .eq('technician_id', user.data.user.id);

        if (error) {
            alert('Error al guardar: ' + error.message);
        } else if (evidence_url) {
            await supabase.from('service_evidences').insert([{
                service_id: document.getElementById('service_id').value,
                evidence_url,
                type: 'photo'
            }]);
            alert('Servicio actualizado con evidencia');
        } else {
            alert('Servicio actualizado');
        }
        logAudit(user.data.user.id, 'servicio_en_campo', updates, 'unknown');
    });
});
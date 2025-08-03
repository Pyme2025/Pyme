document.addEventListener('DOMContentLoaded', async () => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('user-info').textContent = `Usuario: ${user.data.user.email}`;

    const origin = document.getElementById('origin');
    const applianceModel = document.getElementById('appliance_model');
    const errorSelect = document.getElementById('error_reported_select');
    const errorText = document.getElementById('error_reported_text');
    const datalist = document.getElementById('whirlpool_models');

    // Cargar catálogo Whirlpool
    const { data: catalog } = await supabase.from('whirlpool_catalog').select('*');
    catalog.forEach(item => {
        const option = document.createElement('option');
        option.value = item.model;
        datalist.appendChild(option);
    });

    origin.addEventListener('change', () => {
        const isWhirlpool = origin.value === 'whirlpool';
        applianceModel.disabled = isWhirlpool;
        errorSelect.style.display = isWhirlpool ? 'block' : 'none';
        errorText.style.display = isWhirlpool ? 'none' : 'block';
        if (isWhirlpool) {
            errorSelect.innerHTML = '<option value="">Selecciona un error</option>';
            const selectedModel = catalog.find(item => item.model === applianceModel.value);
            if (selectedModel && selectedModel.common_errors) {
                selectedModel.common_errors.forEach(error => {
                    const option = document.createElement('option');
                    option.value = error;
                    option.textContent = error;
                    errorSelect.appendChild(option);
                });
            }
        }
    });

    document.getElementById('serviceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const isWhirlpool = origin.value === 'whirlpool';
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

        const { error } = await supabase.from('services').insert([{
            is_whirlpool: isWhirlpool,
            customer_name: document.getElementById('customer_name').value,
            customer_address: document.getElementById('customer_address').value,
            customer_phone: document.getElementById('customer_phone').value,
            appliance_type: document.getElementById('appliance_type').value,
            appliance_model: document.getElementById('appliance_model').value,
            error_reported: isWhirlpool ? errorSelect.value : errorText.value,
            technician_id: user.data.user.id,
            scheduled_date: document.getElementById('scheduled_date').value,
            urgency: document.getElementById('urgency').value
        }]);
        if (error) {
            alert('Error al guardar servicio: ' + error.message);
        } else {
            alert(`Servicio ${isWhirlpool ? 'Whirlpool' : 'propio'} registrado con éxito`);
            logAudit(user.data.user.id, 'alta_servicio', { origin: origin.value }, 'unknown');
            window.location.href = 'dashboard.html';
        }
    });
});
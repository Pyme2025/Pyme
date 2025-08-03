// roles.js

document.addEventListener('DOMContentLoaded', function() {
    const rolesTable = document.getElementById('rolesTable');
    const addRoleForm = document.getElementById('addRoleForm');
    const roleNameInput = document.getElementById('roleName');

    // Function to fetch and display roles
    function fetchRoles() {
        // Fetch roles from the server (placeholder URL)
        fetch('/api/roles')
            .then(response => response.json())
            .then(data => {
                rolesTable.innerHTML = '';
                data.forEach(role => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${role.id}</td>
                        <td>${role.name}</td>
                        <td>
                            <button onclick="editRole(${role.id})">Edit</button>
                            <button onclick="deleteRole(${role.id})">Delete</button>
                        </td>
                    `;
                    rolesTable.appendChild(row);
                });
            })
            .catch(error => console.error('Error fetching roles:', error));
    }

    // Function to add a new role
    addRoleForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const roleName = roleNameInput.value;

        fetch('/api/roles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: roleName })
        })
        .then(response => response.json())
        .then(data => {
            fetchRoles(); // Refresh the roles list
            addRoleForm.reset(); // Clear the form
        })
        .catch(error => console.error('Error adding role:', error));
    });

    // Function to edit a role
    window.editRole = function(roleId) {
        // Logic to edit a role (placeholder)
        console.log('Editing role with ID:', roleId);
    };

    // Function to delete a role
    window.deleteRole = function(roleId) {
        fetch(`/api/roles/${roleId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                fetchRoles(); // Refresh the roles list
            } else {
                console.error('Error deleting role:', response.statusText);
            }
        })
        .catch(error => console.error('Error deleting role:', error));
    };

    // Initial fetch of roles
    fetchRoles();
});
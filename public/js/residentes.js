document.addEventListener('DOMContentLoaded', () => {
    console.log('residentes.js cargado correctamente');

    const residentList = document.getElementById('residentList');
    const addButton = document.getElementById('addButton');
    const addResidentModal = document.getElementById('addResidentModal');
    const addResidentForm = document.getElementById('addResidentForm');
    const closeModalButton = document.getElementById('closeModal');
    const habitacionSelect = document.getElementById('habitacion_id');
    const camaSelect = document.getElementById('cama_id');

    const editResidentModal = document.getElementById('editResidentModal');
    const editResidentForm = document.getElementById('editResidentForm');
    const closeEditModalButton = document.getElementById('closeEditModal');
    const editHabitacionSelect = document.getElementById('edit_habitacion_id');
    const editCamaSelect = document.getElementById('edit_cama_id');

    let currentEditId = null;

    const fetchResidents = async () => {
        try {
            const response = await fetch('/residentes');
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const residents = await response.json();
            renderResidents(residents);
        } catch (err) {
            console.error('Error al obtener residentes:', err);
        }
    };

    const renderResidents = (residents) => {
        residentList.innerHTML = '';
        if (residents.length === 0) {
            residentList.innerHTML = '<p>No se encontraron residentes.</p>';
            return;
        }
        residents.forEach((resident) => {
            const card = document.createElement('div');
            card.classList.add('resident-card');
            card.innerHTML = `
                <img src="/images/people.png" alt="Residente">
                <div class="resident-info">
                    <h2>${resident.nombre} ${resident.apellido}</h2>
                    <p>Habitación: ${resident.habitacion_id || 'N/A'}</p>
                    <p>Edad: ${calculateAge(resident.fecha_nacimiento)} años</p>
                    <p>Estado: ${resident.estado_salud || 'N/A'}</p>
                </div>
                <div class="resident-actions">
                    <button class="edit-button" data-id="${resident.id}">Editar</button>
                    <button class="delete-button" data-id="${resident.id}">Eliminar</button>
                </div>
            `;
            residentList.appendChild(card);
        });

        document.querySelectorAll('.edit-button').forEach((button) => {
            button.addEventListener('click', (event) => {
                currentEditId = event.target.getAttribute('data-id');
                openEditModal(currentEditId);
            });
        });

        document.querySelectorAll('.delete-button').forEach((button) => {
            button.addEventListener('click', (event) => {
                const residentId = event.target.getAttribute('data-id');
                deleteResident(residentId);
            });
        });
    };

    const calculateAge = (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const fetchHabitaciones = async (selectElement) => {
        try {
            const response = await fetch('/habitaciones');
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const habitaciones = await response.json();
            renderOptions(selectElement, habitaciones, 'Seleccione una habitación', 'numero');
        } catch (error) {
            console.error('Error al cargar habitaciones:', error);
        }
    };

    const fetchCamas = async (habitacionId, selectElement) => {
        try {
            const response = await fetch(`/camas/${habitacionId}`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const camas = await response.json();
            renderOptions(selectElement, camas, 'Seleccione una cama', 'id');
        } catch (error) {
            console.error('Error al cargar camas:', error);
        }
    };

    const renderOptions = (selectElement, items, defaultText, key) => {
        selectElement.innerHTML = `<option value="" disabled>${defaultText}</option>`;
        items.forEach((item) => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item[key];
            selectElement.appendChild(option);
        });
    };

    habitacionSelect.addEventListener('change', () => {
        const selectedHabitacionId = habitacionSelect.value;
        if (selectedHabitacionId) {
            fetchCamas(selectedHabitacionId, camaSelect);
        }
    });

    editHabitacionSelect.addEventListener('change', () => {
        const selectedHabitacionId = editHabitacionSelect.value;
        if (selectedHabitacionId) {
            fetchCamas(selectedHabitacionId, editCamaSelect);
        }
    });

    addButton.addEventListener('click', () => {
        fetchHabitaciones(habitacionSelect);
        addResidentModal.classList.remove('hidden');
    });

    closeModalButton.addEventListener('click', () => {
        addResidentModal.classList.add('hidden');
        camaSelect.innerHTML = '';
    });

    addResidentForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(addResidentForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/residentes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                fetchResidents();
                addResidentModal.classList.add('hidden');
                addResidentForm.reset();
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (err) {
            console.error('Error al agregar residente:', err);
            alert('Error al agregar el residente. Por favor, intenta nuevamente.');
        }
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const openEditModal = async (residentId) => {
        try {
            const response = await fetch(`/residentes/${residentId}`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const resident = await response.json();

            editResidentForm['nombre'].value = resident.nombre;
            editResidentForm['apellido'].value = resident.apellido;
            editResidentForm['fecha_nacimiento'].value = formatDate(resident.fecha_nacimiento);
            await fetchHabitaciones(editHabitacionSelect);

            editHabitacionSelect.value = resident.habitacion_id || '';
            await fetchCamas(resident.habitacion_id, editCamaSelect);

            if (resident.cama_id) {
                const currentOption = document.createElement('option');
                currentOption.value = resident.cama_id;
                currentOption.textContent = `Cama actual (${resident.cama_id})`;
                currentOption.selected = true;
                editCamaSelect.prepend(currentOption);
            }

            editResidentForm['estado_salud'].value = resident.estado_salud;

            editResidentModal.classList.remove('hidden');
        } catch (error) {
            console.error('Error al cargar datos del residente:', error);
        }
    };

    const deleteResident = async (residentId) => {
        if (confirm('¿Estás seguro de que deseas eliminar a este residente?')) {
            try {
                const response = await fetch(`/residentes/${residentId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert('Residente eliminado exitosamente.');
                    fetchResidents();
                } else {
                    const error = await response.json();
                    alert(error.message);
                }
            } catch (err) {
                console.error('Error al eliminar residente:', err);
                alert('Error al eliminar el residente. Por favor, intenta nuevamente.');
            }
        }
    };

    closeEditModalButton.addEventListener('click', () => {
        editResidentModal.classList.add('hidden');
    });

    editResidentForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(editResidentForm);
        const data = Object.fromEntries(formData.entries());

        if (!data.cama_id) {
            delete data.cama_id;
        }

        try {
            const response = await fetch(`/residentes/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert('Residente actualizado exitosamente.');
                fetchResidents();
                editResidentModal.classList.add('hidden');
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (err) {
            console.error('Error al actualizar residente:', err);
        }
    });

    fetchResidents();
});

// Detectar qué página está activa y cargar lógica específica
document.addEventListener('DOMContentLoaded', () => {
    console.log('residentes.js cargado correctamente');

    const currentPage = document.body.getAttribute('data-page');

    if (currentPage === 'residentes') {
        console.log('Cargando lógica de residentes...');
        loadResidentesLogic();
    }

    const routes = {
        inicio: '/html/dashboard.html',
        residentes: '/html/residente.html',
        reportes: '/html/reportes.html',
        habitaciones: '/html/habitaciones.html',
        configuracion: '/html/configuracion.html',
        'cerrar-sesion': '/html/index.html'
    };

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const routeKey = item.id;
            if (routes[routeKey]) {
                window.location.href = routes[routeKey];
            } else {
                console.error(`No se encontró una ruta para: ${routeKey}`);
            }
        });
    });
});

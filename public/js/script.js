document.addEventListener('DOMContentLoaded', () => {
    console.log('script.js cargado correctamente');

    // Rutas para la navegación
    const routes = {
        inicio: '/html/dashboard.html',
        residentes: '/html/residente.html',
        reportes: '/html/reportes.html', // Cambia por el nombre correcto del archivo
        habitaciones: '/html/habitaciones.html',
        configuracion: '/html/configuracion.html', // Cambia por el nombre correcto del archivo
        'cerrar-sesion': '/html/index.html'
    };

    // Configuración de navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const routeKey = item.id; // El ID del enlace
            if (routes[routeKey]) {
                window.location.href = routes[routeKey];
            } else {
                console.error(`No se encontró una ruta para: ${routeKey}`);
            }
        });
    });

    // Elementos del DOM
    const residentList = document.getElementById('residentList');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const addButton = document.getElementById('addButton');
    const addResidentModal = document.getElementById('addResidentModal');
    const addResidentForm = document.getElementById('addResidentForm');
    const closeModalButton = document.getElementById('closeModal');

    // Función para cargar todos los residentes
    const fetchResidents = async () => {
        try {
            const response = await fetch('/residentes');
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const residents = await response.json();
            renderResidents(residents);
        } catch (error) {
            console.error('Error al cargar residentes:', error);
        }
    };

    // Función para buscar residentes
    const searchResidents = async (term) => {
        try {
            const response = await fetch(`/residentes/buscar?term=${encodeURIComponent(term)}`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const residents = await response.json();
            renderResidents(residents);
        } catch (error) {
            console.error('Error al buscar residentes:', error);
        }
    };

    // Función para renderizar la lista de residentes
    const renderResidents = (residents) => {
        residentList.innerHTML = ''; // Limpia la lista actual
        if (residents.length === 0) {
            residentList.innerHTML = '<p>No se encontraron residentes.</p>';
            return;
        }
        residents.forEach(resident => {
            const residentCard = document.createElement('div');
            residentCard.classList.add('resident-card');
            residentCard.innerHTML = `
                <img src="/images/people.png" alt="Residente">
                <div class="resident-info">
                    <h2>${resident.nombre} ${resident.apellido}</h2>
                    <p>Habitación: ${resident.habitacion_id || 'N/A'} - Cama: ${resident.cama_id || 'N/A'}</p>
                    <p>Edad: ${calculateAge(resident.fecha_nacimiento)} años</p>
                    <p>Estado: ${resident.estado_salud || 'Desconocido'}</p>
                </div>
                <button class="details-button">Ver Detalles</button>
            `;
            residentList.appendChild(residentCard);
        });
    };

    // Función para calcular la edad a partir de la fecha de nacimiento
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

    // Manejar búsqueda de residentes
    searchButton.addEventListener('click', () => {
        const term = searchInput.value.trim();
        if (term) {
            searchResidents(term);
        } else {
            fetchResidents(); // Si no hay término, cargar todos
        }
    });

    // Abrir el modal de agregar residente
    addButton.addEventListener('click', () => {
        addResidentModal.classList.remove('hidden');
    });

    // Cerrar el modal
    closeModalButton.addEventListener('click', () => {
        addResidentModal.classList.add('hidden');
    });

    // Manejar el formulario de agregar residente
    addResidentForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(addResidentForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/residentes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                addResidentModal.classList.add('hidden');
                fetchResidents(); // Recargar la lista de residentes
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error al agregar residente:', error);
            alert('Error en el servidor. Por favor, intenta de nuevo más tarde.');
        }
    });

    // Cargar la lista de residentes al inicio
    fetchResidents();
});

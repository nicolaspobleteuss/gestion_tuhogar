function toggleBedInfo(element) {
    // Remueve todas las interfaces visibles
    document.querySelectorAll('.bed-info').forEach(info => info.remove());

    // Verifica si ya existe un contenedor de información en la cama
    const bedName = element.getAttribute('data-name') || 'Cama desconocida';
    const status = element.getAttribute('data-status') || 'Estado desconocido';
    const resident = element.getAttribute('data-resident') || 'No asignado';

    // Crea el contenedor de información
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('bed-info');
    infoDiv.innerHTML = `
        <p class="status">${bedName}</p>
        <p><strong>Estado:</strong> ${status}</p>
        <p><strong>Residente:</strong> ${resident}</p>
    `;

    // Añade el contenedor al documento
    document.body.appendChild(infoDiv);

    // Calcula la posición de la cama seleccionada
    const rect = element.getBoundingClientRect();
    const scrollY = window.scrollY;

    infoDiv.style.top = `${rect.bottom + scrollY + 10}px`; // Justo debajo de la cama
    infoDiv.style.left = `${rect.left + rect.width / 2 - infoDiv.offsetWidth / 2}px`; // Centrado horizontalmente
    infoDiv.classList.add('show');
}

// Añade el evento a las camas
document.querySelectorAll('.bed').forEach(bed => {
    bed.addEventListener('click', function (event) {
        event.stopPropagation();
        toggleBedInfo(this);
    });
});

// Cierra todas las interfaces al hacer clic en cualquier otra parte
document.addEventListener('click', function () {
    document.querySelectorAll('.bed-info').forEach(info => info.remove());
});

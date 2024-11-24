document.addEventListener('DOMContentLoaded', () => {
    console.log('Formulario de login cargado correctamente.');

    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        console.error('Formulario de login no encontrado.');
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evita la recarga de la página

        const correo = document.getElementById('username').value.trim();
        const contraseña = document.getElementById('password').value.trim();

        if (!correo || !contraseña) {
            console.error('Campos incompletos.');
            alert('Por favor, completa todos los campos.');
            return;
        }

        console.log('Datos ingresados:', { correo, contraseña });

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ correo, contraseña }),
            });

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (response.ok) {
                alert(result.message); // Mensaje de éxito
                window.location.href = '/html/dashboard.html'; // Redirige al dashboard
            } else {
                alert(result.message); // Mensaje de error
            }
        } catch (error) {
            console.error('Error en el login:', error);
            alert('Error en el servidor. Por favor, intenta de nuevo más tarde.');
        }
    });
});

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('./db'); // Conexión a la base de datos

const app = express();
const PORT = 3000;

// Middleware para manejar JSON y datos de formularios
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static('public'));

// Ruta principal para index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/html/index.html');
});

// Ruta para el login
app.post('/login', async (req, res) => {
    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
        return res.status(400).json({ message: 'Por favor, completa todos los campos.' });
    }

    const query = `SELECT * FROM administradores WHERE correo = ?`;

    try {
        const [results] = await mysql.execute(query, [correo]);
        if (results.length === 0) {
            return res.status(401).json({ message: 'Correo no registrado.' });
        }

        const admin = results[0];
        if (admin.contrasena === contraseña) {
            return res.status(200).json({ message: 'Login exitoso.', admin });
        } else {
            return res.status(401).json({ message: 'Contraseña incorrecta.' });
        }
    } catch (error) {
        console.error('Error al ejecutar la consulta SQL:', error.message);
        return res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// Obtener todos los residentes
app.get('/residentes', async (req, res) => {
    const query = `SELECT * FROM residentes`;
    try {
        const [results] = await mysql.execute(query);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error al obtener residentes:', error.message);
        res.status(500).json({ message: 'Error al obtener residentes.' });
    }
});

// Buscar residentes por nombre o habitación
app.get('/residentes/buscar', async (req, res) => {
    const { term } = req.query;
    const query = `
        SELECT * FROM residentes 
        WHERE nombre LIKE ? OR habitacion_id LIKE ?
    `;
    try {
        const [results] = await mysql.execute(query, [`%${term}%`, `%${term}%`]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error al buscar residentes:', error.message);
        res.status(500).json({ message: 'Error al buscar residentes.' });
    }
});

// Agregar un nuevo residente y actualizar la cama
app.post('/residentes', async (req, res) => {
    const { nombre, apellido, fecha_nacimiento, habitacion_id, cama_id, estado_salud, registrado_por } = req.body;

    const insertQuery = `
        INSERT INTO residentes 
        (nombre, apellido, fecha_nacimiento, habitacion_id, cama_id, estado_salud, registrado_por) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const updateCamaQuery = `
        UPDATE camas 
        SET estado = 'ocupado' 
        WHERE id = ?
    `;

    try {
        // Insertar nuevo residente
        const [insertResults] = await mysql.execute(insertQuery, [
            nombre, apellido, fecha_nacimiento, habitacion_id, cama_id, estado_salud, registrado_por || null
        ]);

        // Actualizar el estado de la cama a 'ocupado'
        await mysql.execute(updateCamaQuery, [cama_id]);

        res.status(201).json({ message: 'Residente agregado exitosamente.', id: insertResults.insertId });
    } catch (error) {
        console.error('Error al agregar residente:', error.message);
        res.status(500).json({ message: 'Error al agregar residente.' });
    }
});

// Obtener todas las habitaciones
app.get('/habitaciones', async (req, res) => {
    const query = 'SELECT * FROM habitaciones';
    try {
        const [results] = await mysql.execute(query);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error al obtener habitaciones:', error);
        res.status(500).json({ message: 'Error al obtener habitaciones.' });
    }
});

// Obtener camas disponibles de una habitación específica
app.get('/camas/:habitacion_id', async (req, res) => {
    const { habitacion_id } = req.params;
    const query = 'SELECT * FROM camas WHERE habitacion_id = ? AND estado = "disponible"';

    try {
        const [results] = await mysql.execute(query, [habitacion_id]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error al obtener camas:', error);
        res.status(500).json({ message: 'Error al obtener camas.' });
    }
});

// Obtener datos de un residente por ID
app.get('/residentes/:id', async (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM residentes WHERE id = ?';
    try {
        const [results] = await mysql.execute(query, [id]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Residente no encontrado.' });
        }
        res.status(200).json(results[0]);
    } catch (error) {
        console.error('Error al obtener residente:', error.message);
        res.status(500).json({ message: 'Error al obtener residente.' });
    }
});

app.put('/residentes/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, fecha_nacimiento, habitacion_id, cama_id, estado_salud } = req.body;

    const getCamaQuery = `SELECT cama_id FROM residentes WHERE id = ?`;
    const updateResidenteQuery = `
        UPDATE residentes 
        SET nombre = ?, apellido = ?, fecha_nacimiento = ?, estado_salud = ?
        WHERE id = ?
    `;
    const updateHabitacionCamaQuery = `
        UPDATE residentes 
        SET habitacion_id = ?, cama_id = ? 
        WHERE id = ?
    `;
    const updateCamaDisponibleQuery = `
        UPDATE camas 
        SET estado = 'disponible' 
        WHERE id = ?
    `;
    const updateCamaOcupadoQuery = `
        UPDATE camas 
        SET estado = 'ocupado' 
        WHERE id = ?
    `;

    try {
        // Obtener la cama anterior del residente
        const [currentCama] = await mysql.execute(getCamaQuery, [id]);
        const previousCamaId = currentCama[0]?.cama_id;

        // Actualizar datos básicos del residente
        await mysql.execute(updateResidenteQuery, [
            nombre, apellido, fecha_nacimiento, estado_salud, id,
        ]);

        // Si habitacion_id o cama_id han cambiado, actualizarlos
        if (habitacion_id && cama_id) {
            await mysql.execute(updateHabitacionCamaQuery, [habitacion_id, cama_id, id]);

            // Liberar la cama anterior si ha cambiado
            if (previousCamaId && previousCamaId !== cama_id) {
                await mysql.execute(updateCamaDisponibleQuery, [previousCamaId]);
            }

            // Marcar la nueva cama como ocupada
            await mysql.execute(updateCamaOcupadoQuery, [cama_id]);
        }

        res.status(200).json({ message: 'Residente actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar residente:', error.message);
        res.status(500).json({ message: 'Error al actualizar residente.' });
    }
});

// Eliminar un residente
app.delete('/residentes/:id', async (req, res) => {
    const { id } = req.params;

    const getCamaQuery = `SELECT cama_id FROM residentes WHERE id = ?`;
    const deleteResidentQuery = `DELETE FROM residentes WHERE id = ?`;
    const updateCamaDisponibleQuery = `
        UPDATE camas 
        SET estado = 'disponible' 
        WHERE id = ?
    `;

    try {
        // Obtener la cama asociada al residente
        const [currentCama] = await mysql.execute(getCamaQuery, [id]);
        const camaId = currentCama[0]?.cama_id;

        // Eliminar al residente
        await mysql.execute(deleteResidentQuery, [id]);

        // Liberar la cama asociada si existe
        if (camaId) {
            await mysql.execute(updateCamaDisponibleQuery, [camaId]);
        }

        res.status(200).json({ message: 'Residente eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar residente:', error.message);
        res.status(500).json({ message: 'Error al eliminar residente.' });
    }
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

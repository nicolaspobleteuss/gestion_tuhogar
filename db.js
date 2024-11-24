const mysql = require('mysql2');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestion_hogar',
    connectTimeout: 10000 // Tiempo máximo en milisegundos
};

// Crear un pool de conexiones
const pool = mysql.createPool(dbConfig).promise();

// Probar la conexión
pool.getConnection()
    .then((connection) => {
        console.log('Conexión exitosa a la base de datos.');
        connection.release(); // Liberar la conexión después de probarla
    })
    .catch((err) => {
        console.error('Error al conectar a la base de datos:', err.message);
    });

// Exportar el pool para usarlo en otros archivos
module.exports = pool;

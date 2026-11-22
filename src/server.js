const express = require('express');
const { MongoClient } = require('mongodb');
const airlineRoutes = require('./routes/airlines');

const app = express();
const port = Number(process.env.PORT || 3002);
const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB;

// Permite que Express reciba solicitudes con datos JSON.
app.use(express.json());

// Conecta las rutas del archivo airlines.js bajo la dirección /airlines.
app.use('/airlines', airlineRoutes);

// Ruta sencilla para comprobar que el servidor está activo.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'aerolineas-tripulantes-api',
  });
});

// Convierte errores de JSON mal escrito en una respuesta entendible.
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ message: 'El JSON enviado no es válido.' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Ocurrió un error interno.' });
});

async function start() {
  if (!mongoUri || !databaseName) {
    throw new Error('Configura MONGODB_URI y MONGODB_DB en el archivo .env.');
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  // Guarda la conexión para que las rutas puedan usar MongoDB.
  app.locals.database = client.db(databaseName);

  const server = app.listen(port, () => {
    console.log(`API disponible en http://localhost:${port}`);
  });

  // Cierra la conexión correctamente al detener el servidor.
  const shutdown = () => {
    server.close(async () => {
      await client.close();
      process.exit(0);
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

if (require.main === module) {
  start().catch((error) => {
    console.error('No se pudo iniciar la API:', error.message);
    process.exitCode = 1;
  });
}

module.exports = app;
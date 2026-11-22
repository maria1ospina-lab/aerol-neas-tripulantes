const { Router } = require('express');
const { ObjectId } = require('mongodb');

const { createAirline } = require('../models/airline');
const { createCrewMember } = require('../models/crewMember');
const { validateAirline, validateCrewMember } = require('../validation');

const router = Router();

function buscarColeccion(req) {
  return req.app.locals.database.collection('airlines');
}

function buscarId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

function responderAirlínea(airline) {
  return {
    id: airline._id.toString(),
    name: airline.name,
    country: airline.country,
    crew: airline.crew || [],
  };
}

// READ: listar todas las aerolíneas
router.get('/', async (req, res) => {
  const airlines = await buscarColeccion(req).find({}).toArray();

  const respuesta = airlines.map((airline) => responderAirlínea(airline));
  return res.status(200).json(respuesta);
});

// CREATE: crear una aerolínea
router.post('/', async (req, res) => {
  const resultado = validateAirline(req.body);

  if (resultado.errors.length > 0) {
    return res.status(400).json({ errors: resultado.errors });
  }

  const airline = createAirline(resultado.value);
  const insertado = await buscarColeccion(req).insertOne(airline);

  return res.status(201).json({
    id: insertado.insertedId.toString(),
    ...airline,
  });
});

// READ: consultar una aerolínea por su ID
router.get('/:airlineId', async (req, res) => {
  const id = buscarId(req.params.airlineId);

  if (!id) {
    return res.status(400).json({ message: 'El ID no es válido.' });
  }

  const airline = await buscarColeccion(req).findOne({ _id: id });

  if (!airline) {
    return res.status(404).json({ message: 'No se encontró la aerolínea.' });
  }

  return res.status(200).json(responderAirlínea(airline));
});

// UPDATE: actualizar nombre y país de una aerolínea
router.put('/:airlineId', async (req, res) => {
  const id = buscarId(req.params.airlineId);

  if (!id) {
    return res.status(400).json({ message: 'El ID no es válido.' });
  }

  const resultado = validateAirline(req.body);

  if (resultado.errors.length > 0) {
    return res.status(400).json({ errors: resultado.errors });
  }

  const coleccion = buscarColeccion(req);
  const actualizacion = await coleccion.updateOne(
    { _id: id },
    { $set: resultado.value },
  );

  if (actualizacion.matchedCount === 0) {
    return res.status(404).json({ message: 'No se encontró la aerolínea.' });
  }

  const airlineActualizada = await coleccion.findOne({ _id: id });
  return res.status(200).json(responderAirlínea(airlineActualizada));
});

// DELETE: eliminar una aerolínea y sus tripulantes embebidos
router.delete('/:airlineId', async (req, res) => {
  const id = buscarId(req.params.airlineId);

  if (!id) {
    return res.status(400).json({ message: 'El ID no es válido.' });
  }

  const eliminacion = await buscarColeccion(req).deleteOne({ _id: id });

  if (eliminacion.deletedCount === 0) {
    return res.status(404).json({ message: 'No se encontró la aerolínea.' });
  }

  return res.status(204).end();
});

// READ: listar los tripulantes de una aerolínea
router.get('/:airlineId/crew', async (req, res) => {
  const id = buscarId(req.params.airlineId);

  if (!id) {
    return res.status(400).json({ message: 'El ID no es válido.' });
  }

  const airline = await buscarColeccion(req).findOne({ _id: id });

  if (!airline) {
    return res.status(404).json({ message: 'No se encontró la aerolínea.' });
  }

  return res.status(200).json(airline.crew || []);
});

// CREATE: agregar un tripulante dentro del arreglo crew
router.post('/:airlineId/crew', async (req, res) => {
  const id = buscarId(req.params.airlineId);

  if (!id) {
    return res.status(400).json({ message: 'El ID no es válido.' });
  }

  const resultado = validateCrewMember(req.body);

  if (resultado.errors.length > 0) {
    return res.status(400).json({ errors: resultado.errors });
  }

  const coleccion = buscarColeccion(req);
  const airline = await coleccion.findOne({ _id: id });

  if (!airline) {
    return res.status(404).json({ message: 'No se encontró la aerolínea.' });
  }

  const crew = airline.crew || [];
  const licenciaRepetida = crew.some(
    (member) => member.licenseNumber.toLowerCase()
      === resultado.value.licenseNumber.toLowerCase(),
  );

  if (licenciaRepetida) {
    return res.status(409).json({ message: 'La licencia ya existe.' });
  }

  const nuevoTripulante = createCrewMember(resultado.value);

  await coleccion.updateOne(
    { _id: id },
    { $push: { crew: nuevoTripulante } },
  );

  return res.status(201).json(nuevoTripulante);
});

// READ: consultar un tripulante dentro de su aerolínea
router.get('/:airlineId/crew/:crewId', async (req, res) => {
  const id = buscarId(req.params.airlineId);

  if (!id) {
    return res.status(400).json({ message: 'El ID no es válido.' });
  }

  const airline = await buscarColeccion(req).findOne({ _id: id });

  if (!airline) {
    return res.status(404).json({ message: 'No se encontró la aerolínea.' });
  }

  const tripulante = (airline.crew || []).find(
    (member) => member.id === req.params.crewId,
  );

  if (!tripulante) {
    return res.status(404).json({ message: 'No se encontró el tripulante.' });
  }

  return res.status(200).json(tripulante);
});

// UPDATE: actualizar un tripulante embebido
router.put('/:airlineId/crew/:crewId', async (req, res) => {
  const id = buscarId(req.params.airlineId);

  if (!id) {
    return res.status(400).json({ message: 'El ID no es válido.' });
  }

  const resultado = validateCrewMember(req.body);

  if (resultado.errors.length > 0) {
    return res.status(400).json({ errors: resultado.errors });
  }

  const coleccion = buscarColeccion(req);
  const airline = await coleccion.findOne({ _id: id });

  if (!airline) {
    return res.status(404).json({ message: 'No se encontró la aerolínea.' });
  }

  const crew = airline.crew || [];
  const posicion = crew.findIndex(
    (member) => member.id === req.params.crewId,
  );

  if (posicion === -1) {
    return res.status(404).json({ message: 'No se encontró el tripulante.' });
  }

  const licenciaRepetida = crew.some(
    (member) => member.id !== req.params.crewId
      && member.licenseNumber.toLowerCase()
        === resultado.value.licenseNumber.toLowerCase(),
  );

  if (licenciaRepetida) {
    return res.status(409).json({ message: 'La licencia ya existe.' });
  }

  crew[posicion] = {
    id: req.params.crewId,
    ...resultado.value,
  };

  await coleccion.updateOne({ _id: id }, { $set: { crew } });

  return res.status(200).json(crew[posicion]);
});

// DELETE: quitar un tripulante del arreglo crew
router.delete('/:airlineId/crew/:crewId', async (req, res) => {
  const id = buscarId(req.params.airlineId);

  if (!id) {
    return res.status(400).json({ message: 'El ID no es válido.' });
  }

  const coleccion = buscarColeccion(req);
  const airline = await coleccion.findOne({ _id: id });

  if (!airline) {
    return res.status(404).json({ message: 'No se encontró la aerolínea.' });
  }

  const existeTripulante = (airline.crew || []).some(
    (member) => member.id === req.params.crewId,
  );

  if (!existeTripulante) {
    return res.status(404).json({ message: 'No se encontró el tripulante.' });
  }

  await coleccion.updateOne(
    { _id: id },
    { $pull: { crew: { id: req.params.crewId } } },
  );

  return res.status(204).end();
});

module.exports = router;
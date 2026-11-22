// Quita espacios de los extremos y normaliza las tildes.
function trimText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().normalize('NFC');
}

function validateAirline(body) {
  const value = {
    name: trimText(body?.name),
    country: trimText(body?.country),
  };

  const errors = [];

  if (!value.name) {
    errors.push('El nombre de la aerolínea es obligatorio.');
  } else if (value.name.length < 2 || value.name.length > 100) {
    errors.push('El nombre debe tener entre 2 y 100 caracteres.');
  }

  if (!value.country) {
    errors.push('El país de operación es obligatorio.');
  } else if (value.country.length > 80) {
    errors.push('El país no puede superar los 80 caracteres.');
  }

  return { value, errors };
}

function validateCrewMember(body) {
  const value = {
    name: trimText(body?.name),
    role: trimText(body?.role),
    licenseNumber: trimText(body?.licenseNumber),
  };

  const errors = [];

  if (!value.name) {
    errors.push('El nombre del tripulante es obligatorio.');
  } else if (!/^[\p{L}\p{M}][\p{L}\p{M}\s'-]*$/u.test(value.name)) {
    errors.push('El nombre solo puede contener letras, espacios, apóstrofes y guiones.');
  }

  if (!value.role) {
    errors.push('El cargo es obligatorio.');
  } else if (value.role.length > 50) {
    errors.push('El cargo no puede superar los 50 caracteres.');
  }

  if (!value.licenseNumber) {
    errors.push('La licencia es obligatoria.');
  } else if (!/^[a-zA-Z0-9-]{3,30}$/.test(value.licenseNumber)) {
    errors.push('La licencia debe tener entre 3 y 30 letras, números o guiones.');
  }

  return { value, errors };
}

module.exports = {
  trimText,
  validateAirline,
  validateCrewMember,
};
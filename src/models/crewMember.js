const { randomUUID } = require('node:crypto');

function createCrewMember({ name, role, licenseNumber }) {
  return {
    id: randomUUID(),
    name,
    role,
    licenseNumber,
  };
}

module.exports = { createCrewMember };
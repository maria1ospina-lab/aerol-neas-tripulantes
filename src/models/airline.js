function createAirline({ name, country }) {
  return {
    name,
    country,
    crew: [],
  };
}

module.exports = { createAirline };
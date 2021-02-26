const pg = require('pg');
const { providers, retrieveObservations } = require('./providers');
var validator = require('validator');

// Postgres database config
const pgConfig = {
  max: 1,
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  host: process.env.SQL_HOSTNAME,
  database: process.env.SQL_DATABASE,
};

let pgPool;

// SQL wrapper
const importObservations = async function (observations) {
  if (!observations.length) {
    return 'Empty';
  }
  if (!pgPool) {
    pgPool = new pg.Pool(pgConfig);
  }
  try {
    await pgPool.query('BEGIN');
    observations = observations.map(
      (o) =>
        `(ST_SetSRID(ST_MakePoint(${o.long}, ${o.lat}), 4326), '${o.id}', '${
          validator.escape(o.author_name)
        }', ${o.depth}, TIMESTAMP '${o.timestamp.toISOString()}', '${
          o.source
        }', ${o.elevation})`
    );
    const query = `
      INSERT INTO observations(location, id, author, depth, timestamp, source, elevation)
      VALUES ${observations}
      ON CONFLICT DO NOTHING
    `;
    await pgPool.query(query);
    await pgPool.query('COMMIT');
  } catch (error) {
    await pgPool.query('ROLLBACK');
    console.error(error);
    return 'Error';
  }
  return 'Success';
};

// Lambda function
exports.handler = async (event, context) => {
  const _ = await retrieveObservations(providers).then((observations) =>
    importObservations(observations)
  );
};

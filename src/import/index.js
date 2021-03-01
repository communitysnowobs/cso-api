const pg = require('pg');
const { providers, retrieveObservations } = require('./providers');

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
    await observations.forEach(async (o) => {
      const obArr = [
        o.long,
        o.lat,
        o.id,
        o.author_name,
        o.depth,
        o.timestamp.toISOString(),
        o.source,
        o.elevation
      ];
      const query = `
        INSERT INTO observations(location, id, author, depth, timestamp, source, elevation)
        VALUES (ST_SetSRID(ST_MakePoint($1, $2),4326), $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `;
      await pgPool.query(query, obArr)
        .catch(err => console.error(err.stack));
    });
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

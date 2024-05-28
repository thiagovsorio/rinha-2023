import pg from "pg";
import { logger } from "./logger";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/postgres";

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: Number(process.env.MAX_DB_CONNECTIONS) || 200,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 0,
});

pool.on("error", connect);

pool.once("connect", async() => {
  try {
    return await pool.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;

      CREATE OR REPLACE FUNCTION gen_searchable(_nome VARCHAR, _apelido VARCHAR, _stack JSON)
          RETURNS TEXT AS $$
          BEGIN
          RETURN _nome || _apelido || _stack;
          END;
      $$ LANGUAGE plpgsql IMMUTABLE;

      CREATE TABLE IF NOT EXISTS pessoas (
          id VARCHAR(255) UNIQUE NOT NULL,
          apelido TEXT UNIQUE NOT NULL,
          nome TEXT NOT NULL,
          nascimento DATE NOT NULL,
          stack JSON,
          searchable text GENERATED ALWAYS AS (gen_searchable(nome, apelido, stack)) STORED
      );

      CREATE INDEX IF NOT EXISTS idx_pessoas_searchable ON public.pessoas USING gist (searchable public.gist_trgm_ops (siglen='64'));

      CREATE UNIQUE INDEX IF NOT EXISTS pessoas_apelido_index ON public.pessoas USING btree (apelido);
    `);
  } catch (err) {
    logger.error(`database.ts: an error occured when creating table ${err}`);
  }
});

async function connect() {
  try {
    logger.info(`Connecting to db ${URL}`);
    await pool.connect();
  } catch (err) {
    setTimeout(() => {
      connect();
      logger.error(
        `database.js: an error occured when connecting ${err} retrying connection on 3 secs`
      );
    }, 10000);
  }
}

await connect();

export const dbInsertPerson = async ({
  id,
  nome,
  apelido,
  nascimento,
  stack,
}: Person): Promise<Person> => {

  await pool.query(
    `
    INSERT INTO pessoas 
    (id, nome, apelido, nascimento, stack) 
    VALUES ($1,$2,$3,$4,$5)
  `,
    [id, nome, apelido, nascimento, JSON.stringify(stack)]
  );

  const person = await dbGetPersonById(id);
  return person;
};

export const dbGetPersonById = async (id: string): Promise<Person> => {
  const { rows } = await pool.query(
    `
      SELECT 
        id,
        apelido,
        nome,
        to_char(nascimento, 'YYYY-MM-DD') as nascimento,
        stack
      FROM pessoas WHERE id = $1
  `,
    [id]
  );

  return rows[0];
};

export const dbGetPersons = async (searchable: string | undefined): Promise<Person[]> => {
  searchable = searchable || "";
  const { rows } = await pool.query(
    `
      SELECT 
        id,
        apelido,
        nome,
        to_char(nascimento, 'YYYY-MM-DD') as nascimento,
        stack
      FROM pessoas
      WHERE searchable ILIKE $1
  `,
    [`%${searchable}%`]
  );

  return rows;
};

export const dbCountPersons = async (): Promise<number> => {
  const { rows } = await pool.query(`SELECT COUNT(*) FROM pessoas`);
  return rows[0].count;
};

export const dbFindByApelido = async (apelido: string): Promise<boolean> => {
  const { rows } = await pool.query(
    `
      SELECT 
        id
      FROM pessoas
      WHERE apelido = $1
    `,
    [apelido]
  );
  return !!rows[0];
};

export type Person = {
  id: string;
  nome: string;
  apelido: string;
  nascimento: string;
  stack: string;
};

const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const { VENTURES } = require("../data/venues");

dotenv.config();

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing.");
  }

  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(schemaSql);

    for (const venue of VENTURES) {
      await pool.query(
        `insert into venues (slug, name, tagline, table_prefix, default_table_count)
         values ($1, $2, $3, $4, $5)
         on conflict (slug)
         do update set
           name = excluded.name,
           tagline = excluded.tagline,
           table_prefix = excluded.table_prefix,
           default_table_count = excluded.default_table_count,
           updated_at = now()`,
        [venue.slug, venue.name, venue.tagline, venue.tablePrefix, venue.defaultTableCount],
      );
    }

    console.log(`Database ready. Seeded ${VENTURES.length} ventures.`);
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

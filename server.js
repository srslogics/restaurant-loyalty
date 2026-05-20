const path = require("node:path");
const express = require("express");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4173);
const rootDir = __dirname;

const connectionString = process.env.DATABASE_URL;
const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })
  : null;

app.use(express.json());
app.use(express.static(rootDir));

function buildReferenceId() {
  const now = new Date();
  return `YFB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function normalizeFeedbackRow(row) {
  return {
    referenceId: row.reference_id,
    venueSlug: row.venue_slug,
    venue: row.venue_name,
    table: row.table_code,
    overallScore: row.overall_score,
    visitType: row.visit_type,
    highlights: row.highlights || [],
    comments: row.comments || "",
    guestName: row.guest_name || "",
    guestPhone: row.guest_phone || "",
    metrics: {
      food: row.food_score || 0,
      service: row.service_score || 0,
      ambience: row.ambience_score || 0,
      cleanliness: row.cleanliness_score || 0,
    },
    createdAt: row.created_at,
  };
}

function requireDatabase(res) {
  if (!pool) {
    res.status(503).json({
      error: "Database is not configured. Set DATABASE_URL before starting the server.",
    });
    return false;
  }
  return true;
}

app.get("/api/health", async (_req, res) => {
  if (!pool) {
    res.status(200).json({ ok: true, database: "not-configured" });
    return;
  }

  try {
    await pool.query("select 1");
    res.status(200).json({ ok: true, database: "connected" });
  } catch (error) {
    res.status(500).json({ ok: false, database: "error", message: error.message });
  }
});

app.get("/api/venues", async (_req, res) => {
  if (!requireDatabase(res)) {
    return;
  }

  try {
    const result = await pool.query(
      `select slug, name, tagline, table_prefix, default_table_count
       from venues
       where is_active = true
       order by name asc`,
    );
    res.json(
      result.rows.map((row) => ({
        slug: row.slug,
        name: row.name,
        tagline: row.tagline,
        tablePrefix: row.table_prefix,
        defaultTableCount: row.default_table_count,
      })),
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/feedback", async (req, res) => {
  if (!requireDatabase(res)) {
    return;
  }

  const clauses = [];
  const values = [];

  if (req.query.venue && req.query.venue !== "all") {
    values.push(req.query.venue);
    clauses.push(`venue_slug = $${values.length}`);
  }

  if (req.query.rating === "low") {
    clauses.push("overall_score <= 2");
  } else if (req.query.rating === "mid") {
    clauses.push("overall_score = 3");
  } else if (req.query.rating === "high") {
    clauses.push("overall_score >= 4");
  }

  const whereSql = clauses.length ? `where ${clauses.join(" and ")}` : "";

  try {
    const result = await pool.query(
      `select reference_id, venue_slug, venue_name, table_code, overall_score, visit_type,
              food_score, service_score, ambience_score, cleanliness_score, highlights,
              comments, guest_name, guest_phone, created_at
       from feedback_responses
       ${whereSql}
       order by created_at desc
       limit 500`,
      values,
    );
    res.json(result.rows.map(normalizeFeedbackRow));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/feedback", async (req, res) => {
  if (!requireDatabase(res)) {
    return;
  }

  const {
    venueSlug,
    venue,
    table,
    overallScore,
    visitType,
    highlights,
    comments,
    guestName,
    guestPhone,
    metrics,
  } = req.body || {};

  if (!venueSlug || !venue || !table || !overallScore) {
    res.status(400).json({ error: "Venue, table, and overall score are required." });
    return;
  }

  const referenceId = buildReferenceId();

  try {
    const venueExists = await pool.query("select slug from venues where slug = $1 and is_active = true", [
      venueSlug,
    ]);

    if (!venueExists.rowCount) {
      res.status(400).json({ error: "Invalid venue selected." });
      return;
    }

    const result = await pool.query(
      `insert into feedback_responses (
          reference_id, venue_slug, venue_name, table_code, overall_score, visit_type,
          food_score, service_score, ambience_score, cleanliness_score, highlights,
          comments, guest_name, guest_phone
        ) values (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14
        )
        returning reference_id, venue_slug, venue_name, table_code, overall_score, visit_type,
                  food_score, service_score, ambience_score, cleanliness_score, highlights,
                  comments, guest_name, guest_phone, created_at`,
      [
        referenceId,
        venueSlug,
        venue,
        table,
        Number(overallScore),
        visitType || "Not specified",
        Number(metrics?.food || 0),
        Number(metrics?.service || 0),
        Number(metrics?.ambience || 0),
        Number(metrics?.cleanliness || 0),
        Array.isArray(highlights) ? highlights : [],
        comments || "",
        guestName || "",
        guestPhone || "",
      ],
    );

    res.status(201).json(normalizeFeedbackRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    next();
    return;
  }

  res.sendFile(path.join(rootDir, req.path === "/" ? "index.html" : req.path));
});

app.listen(port, () => {
  console.log(`Yamazaki app running on http://127.0.0.1:${port}`);
});

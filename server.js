const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection (Render provides DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // needed for Render
});

app.use(bodyParser.json());
app.use(express.static("public"));

// Ensure table exists
(async () => {
  try{
    await pool.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        short_code VARCHAR(10) UNIQUE NOT NULL,
        long_url TEXT NOT NULL
      );
    `);
    await pool.query(`ALTER TABLE urls ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;`);
    console.log("✅ Database schema ensured");
  } catch (err) {
    console.error("DB migration error:", err);
  }
})();

// Generate random short code
function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

// Shorten a URL
app.post("/api/shorten", async (req, res) => {
  console.log("Incoming body:", req.body);
  const { longUrl, customAlias, expiryDays } = req.body;
  if (!longUrl) return res.status(400).json({ error: "longUrl is required" });

  // choose shortCode: custom alias if given, else random
  const shortCode = customAlias || Math.random().toString(36).substring(2, 8);

  try {
    // optional expiry logic
    let expiresAt = null;
    if (expiryDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
    }

    await pool.query(
      `INSERT INTO urls (short_code, long_url, expires_at) VALUES ($1, $2, $3)`,
      [shortCode, longUrl, expiresAt]
    );

    res.json({
      shortUrl: `${req.protocol}://${req.headers.host}/${shortCode}`,
      shortCode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});
// Redirect to long URL
app.get("/:code", async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query("SELECT long_url FROM urls WHERE short_code = $1", [code]);

    if (result.rows.length > 0) {
      res.redirect(result.rows[0].long_url);
    } else {
      res.status(404).send("URL not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

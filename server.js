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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS urls (
      id SERIAL PRIMARY KEY,
      short_code VARCHAR(10) UNIQUE NOT NULL,
      long_url TEXT NOT NULL
    );
  `);
})();

// Generate random short code
function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

// Shorten a URL
app.post("/api/shorten", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const shortCode = generateShortCode();

  try {
    await pool.query("INSERT INTO urls (short_code, long_url) VALUES ($1, $2)", [
      shortCode,
      url,
    ]);
    res.json({ shortUrl: `${req.headers.host}/${shortCode}` });
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

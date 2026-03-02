import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

const db = new Database("tantra_tech.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS soil_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region TEXT,
    soil_type TEXT,
    ph_level REAL,
    nitrogen REAL,
    phosphorus REAL,
    potassium REAL
  );

  CREATE TABLE IF NOT EXISTS climate_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region TEXT,
    month TEXT,
    avg_temp REAL,
    avg_rainfall REAL,
    year INTEGER
  );

  CREATE TABLE IF NOT EXISTS crop_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_name TEXT,
    soil_type TEXT,
    min_temp REAL,
    max_temp REAL,
    min_rainfall REAL,
    max_rainfall REAL,
    sowing_period TEXT
  );
`);

// Seed some initial data if empty
const rowCount = db.prepare("SELECT COUNT(*) as count FROM crop_recommendations").get() as { count: number };
if (rowCount.count === 0) {
  const insertCrop = db.prepare(`
    INSERT INTO crop_recommendations (crop_name, soil_type, min_temp, max_temp, min_rainfall, max_rainfall, sowing_period)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCrop.run("Wheat", "Loamy", 10, 25, 400, 600, "Oct-Nov");
  insertCrop.run("Rice", "Clayey", 20, 35, 1000, 2000, "Jun-Jul");
  insertCrop.run("Cotton", "Black", 18, 30, 500, 1000, "May-Jun");
  insertCrop.run("Maize", "Alluvial", 15, 30, 600, 1200, "Jun-Jul");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/crops", (req, res) => {
    const crops = db.prepare("SELECT * FROM crop_recommendations").all();
    res.json(crops);
  });

  app.get("/api/climate/:region", (req, res) => {
    const { region } = req.params;
    // Mocking some data for the demo if not in DB
    const data = [
      { month: "Jan", temp: 22, rainfall: 10 },
      { month: "Feb", temp: 24, rainfall: 15 },
      { month: "Mar", temp: 28, rainfall: 5 },
      { month: "Apr", temp: 32, rainfall: 2 },
      { month: "May", temp: 35, rainfall: 20 },
      { month: "Jun", temp: 30, rainfall: 150 },
      { month: "Jul", temp: 28, rainfall: 250 },
      { month: "Aug", temp: 27, rainfall: 200 },
      { month: "Sep", temp: 28, rainfall: 120 },
      { month: "Oct", temp: 26, rainfall: 40 },
      { month: "Nov", temp: 24, rainfall: 10 },
      { month: "Dec", temp: 22, rainfall: 5 },
    ];
    res.json(data);
  });

  app.post("/api/recommend", (req, res) => {
    const { soilType, region } = req.body;
    const crops = db.prepare("SELECT * FROM crop_recommendations WHERE soil_type = ?").all(soilType);
    res.json(crops);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import db from "#db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).end();
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).end();
    req.user = user;
    next();
  });
}

// User registration
app.post("/users/register", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).end();
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, hash]
    );
    const token = jwt.sign({ id: result.rows[0].id }, JWT_SECRET);
    res.status(201).send(token);
  } catch (e) {
    res.status(400).end();
  }
});

// User login
app.post("/users/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).end();
  const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
  if (result.rows.length === 0) return res.status(400).end();
  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).end();
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.status(200).send(token);
});

// Protect all /playlists and /tracks/:id/playlists routes
app.use(["/playlists", "/tracks/:id/playlists"], authenticateToken);

// /tracks router
app.get("/tracks", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM tracks");
  res.json(rows);
});

app.get("/tracks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).end();
  const { rows } = await db.query("SELECT * FROM tracks WHERE id = $1", [id]);
  if (rows.length === 0) return res.status(404).end();
  res.json(rows[0]);
});

// /playlists router
app.get("/playlists", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM playlists WHERE user_id = $1", [req.user.id]);
  res.json(rows);
});

app.post("/playlists", async (req, res) => {
  const { name, description } = req.body || {};
  if (!name || !description) return res.status(400).end();
  const result = await db.query(
    "INSERT INTO playlists (name, description, user_id) VALUES ($1, $2, $3) RETURNING *",
    [name, description, req.user.id]
  );
  res.status(201).json(result.rows[0]);
});

app.get("/playlists/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).end();
  const { rows } = await db.query("SELECT * FROM playlists WHERE id = $1", [id]);
  if (rows.length === 0) return res.status(404).end();
  const playlist = rows[0];
  if (playlist.user_id !== req.user.id) return res.status(403).end();
  res.json(playlist);
});

app.get("/playlists/:id/tracks", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).end();
  const playlist = await db.query("SELECT * FROM playlists WHERE id = $1", [id]);
  if (playlist.rows.length === 0) return res.status(404).end();
  if (playlist.rows[0].user_id !== req.user.id) return res.status(403).end();
  const { rows } = await db.query(
    `SELECT t.* FROM tracks t JOIN playlists_tracks pt ON t.id = pt.track_id WHERE pt.playlist_id = $1`,
    [id]
  );
  res.json(rows);
});

app.post("/playlists/:id/tracks", async (req, res) => {
  const playlistId = Number(req.params.id);
  const { trackId } = req.body || {};
  if (isNaN(playlistId)) return res.status(400).end();
  if (trackId === undefined || trackId === null || isNaN(Number(trackId))) return res.status(400).end();
  // Check playlist exists and ownership
  const playlist = await db.query("SELECT * FROM playlists WHERE id = $1", [playlistId]);
  if (playlist.rows.length === 0) return res.status(404).end();
  if (playlist.rows[0].user_id !== req.user.id) return res.status(403).end();
  // Check track exists
  const track = await db.query("SELECT * FROM tracks WHERE id = $1", [Number(trackId)]);
  if (track.rows.length === 0) return res.status(400).end();
  // Check if already in playlist
  const exists = await db.query(
    "SELECT * FROM playlists_tracks WHERE playlist_id = $1 AND track_id = $2",
    [playlistId, Number(trackId)]
  );
  if (exists.rows.length > 0) {
    return res.status(400).end();
  }
  // Insert
  const result = await db.query(
    "INSERT INTO playlists_tracks (playlist_id, track_id) VALUES ($1, $2) RETURNING *",
    [playlistId, Number(trackId)]
  );
  res.status(201).json(result.rows[0]);
});

// GET /tracks/:id/playlists - playlists owned by user that contain the track
app.get("/tracks/:id/playlists", authenticateToken, async (req, res) => {
  const trackId = Number(req.params.id);
  if (isNaN(trackId)) return res.status(400).end();
  // Check if track exists
  const track = await db.query("SELECT * FROM tracks WHERE id = $1", [trackId]);
  if (track.rows.length === 0) return res.status(404).end();
  // Always return 200 with an array (even if empty)
  const { rows } = await db.query(
    `SELECT p.* FROM playlists p
     JOIN playlists_tracks pt ON p.id = pt.playlist_id
     WHERE pt.track_id = $1 AND p.user_id = $2`,
    [trackId, req.user.id]
  );
  res.status(200).json(rows);
});

export default app;

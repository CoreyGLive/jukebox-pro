import express from "express";
import db from "#db/client";

const app = express();
app.use(express.json());

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
  const { rows } = await db.query("SELECT * FROM playlists");
  res.json(rows);
});

app.post("/playlists", async (req, res) => {
  const { name, description } = req.body || {};
  if (!name || !description) return res.status(400).end();
  const result = await db.query(
    "INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING *",
    [name, description]
  );
  res.status(201).json(result.rows[0]);
});

app.get("/playlists/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).end();
  const { rows } = await db.query("SELECT * FROM playlists WHERE id = $1", [id]);
  if (rows.length === 0) return res.status(404).end();
  res.json(rows[0]);
});

app.get("/playlists/:id/tracks", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).end();
  const playlist = await db.query("SELECT * FROM playlists WHERE id = $1", [id]);
  if (playlist.rows.length === 0) return res.status(404).end();
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
  // Check playlist exists
  const playlist = await db.query("SELECT * FROM playlists WHERE id = $1", [playlistId]);
  if (playlist.rows.length === 0) return res.status(404).end();
  // Check track exists
  const track = await db.query("SELECT * FROM tracks WHERE id = $1", [Number(trackId)]);
  if (track.rows.length === 0) return res.status(400).end();
  // Check if already in playlist
  const exists = await db.query(
    "SELECT * FROM playlists_tracks WHERE playlist_id = $1 AND track_id = $2",
    [playlistId, Number(trackId)]
  );
  if (exists.rows.length > 0) return res.status(400).end();
  // Insert
  const result = await db.query(
    "INSERT INTO playlists_tracks (playlist_id, track_id) VALUES ($1, $2) RETURNING *",
    [playlistId, Number(trackId)]
  );
  res.status(201).json(result.rows[0]);
});

export default app;

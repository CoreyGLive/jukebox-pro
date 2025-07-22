import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  // Clear existing data
  await db.query('TRUNCATE playlists_tracks, playlists, tracks RESTART IDENTITY CASCADE');

  // Seed tracks
  const tracks = [
    { name: 'Songbird', duration_ms: 180000 },
    { name: 'Midnight Drive', duration_ms: 210000 },
    { name: 'Sunrise', duration_ms: 200000 },
    { name: 'Chill Vibes', duration_ms: 240000 },
    { name: 'Electric Dreams', duration_ms: 230000 },
    { name: 'Ocean Eyes', duration_ms: 220000 },
    { name: 'Neon Lights', duration_ms: 250000 },
    { name: 'Lost in Space', duration_ms: 260000 },
    { name: 'Golden Hour', duration_ms: 195000 },
    { name: 'Nightfall', duration_ms: 205000 },
    { name: 'Starlight', duration_ms: 215000 },
    { name: 'Wanderlust', duration_ms: 225000 },
    { name: 'Daydream', duration_ms: 235000 },
    { name: 'Afterglow', duration_ms: 245000 },
    { name: 'Pulse', duration_ms: 255000 },
    { name: 'Echoes', duration_ms: 265000 },
    { name: 'Gravity', duration_ms: 275000 },
    { name: 'Reflections', duration_ms: 185000 },
    { name: 'Serenity', duration_ms: 195500 },
    { name: 'Momentum', duration_ms: 205500 }
  ];
  const trackIds = [];
  for (const track of tracks) {
    const result = await db.query(
      'INSERT INTO tracks (name, duration_ms) VALUES ($1, $2) RETURNING id',
      [track.name, track.duration_ms]
    );
    trackIds.push(result.rows[0].id);
  }

  // Seed playlists
  const playlists = [
    { name: 'Morning Motivation', description: 'Start your day right!' },
    { name: 'Evening Chill', description: 'Relax after a long day.' },
    { name: 'Workout Hits', description: 'Pump up your workout.' },
    { name: 'Study Session', description: 'Focus and get things done.' },
    { name: 'Party Time', description: 'Get the party started!' },
    { name: 'Road Trip', description: 'Songs for the open road.' },
    { name: 'Rainy Days', description: 'Perfect for a rainy afternoon.' },
    { name: 'Feel Good', description: 'Boost your mood.' },
    { name: 'Throwback', description: 'Hits from the past.' },
    { name: 'Sleep Tight', description: 'Wind down for the night.' }
  ];
  const playlistIds = [];
  for (const playlist of playlists) {
    const result = await db.query(
      'INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING id',
      [playlist.name, playlist.description]
    );
    playlistIds.push(result.rows[0].id);
  }

  // Seed playlists_tracks (at least 15 associations)
  const associations = [
    [playlistIds[0], trackIds[0]],
    [playlistIds[0], trackIds[1]],
    [playlistIds[1], trackIds[2]],
    [playlistIds[1], trackIds[3]],
    [playlistIds[2], trackIds[4]],
    [playlistIds[2], trackIds[5]],
    [playlistIds[3], trackIds[6]],
    [playlistIds[3], trackIds[7]],
    [playlistIds[4], trackIds[8]],
    [playlistIds[4], trackIds[9]],
    [playlistIds[5], trackIds[10]],
    [playlistIds[5], trackIds[11]],
    [playlistIds[6], trackIds[12]],
    [playlistIds[7], trackIds[13]],
    [playlistIds[8], trackIds[14]],
    [playlistIds[9], trackIds[15]],
    [playlistIds[9], trackIds[16]],
    [playlistIds[8], trackIds[17]],
    [playlistIds[7], trackIds[18]],
    [playlistIds[6], trackIds[19]]
  ];
  for (const [playlistId, trackId] of associations) {
    await db.query(
      'INSERT INTO playlists_tracks (playlist_id, track_id) VALUES ($1, $2)',
      [playlistId, trackId]
    );
  }
}

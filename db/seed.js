import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  // Clear existing data
  await db.query('TRUNCATE playlists_tracks, playlists, tracks, users RESTART IDENTITY CASCADE');

  // Seed users
  const users = [
    { username: 'alice', password: 'password1' },
    { username: 'bob', password: 'password2' }
  ];
  const userIds = [];
  for (const user of users) {
    // In production, hash the password! For seed, store as plain text for now.
    const result = await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [user.username, user.password]
    );
    userIds.push(result.rows[0].id);
  }

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

  // Seed playlists (each user gets at least 1 playlist with at least 5 tracks)
  const playlists = [
    { name: 'Alice Playlist', description: 'Alice jams', user_id: userIds[0] },
    { name: 'Bob Playlist', description: 'Bob jams', user_id: userIds[1] }
  ];
  const playlistIds = [];
  for (const playlist of playlists) {
    const result = await db.query(
      'INSERT INTO playlists (name, description, user_id) VALUES ($1, $2, $3) RETURNING id',
      [playlist.name, playlist.description, playlist.user_id]
    );
    playlistIds.push(result.rows[0].id);
  }

  // Seed playlists_tracks (each playlist gets 5 tracks)
  for (let i = 0; i < playlistIds.length; i++) {
    for (let j = 0; j < 5; j++) {
      await db.query(
        'INSERT INTO playlists_tracks (playlist_id, track_id) VALUES ($1, $2)',
        [playlistIds[i], trackIds[i * 5 + j]]
      );
    }
  }
}

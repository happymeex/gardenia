# Gardenia

A browser-based 2D platformer game. Play as a shapeshifting forest spirit defending her home from robots. [Play online](https://gardenia-production.up.railway.app/).

<img src="https://i.imgur.com/7STtkWz.jpg" height="180"> <img src="https://i.imgur.com/qEUJZk4.jpg" height="180">

## Quick Start

1. **Requirements:** Go, Node.js, Redis, PostgreSQL
2. **Clone & Install:**
   ```sh
   git clone https://github.com/happymeex/gardenia.git
   cd gardenia
   npm install
   ```
3. **Configure Environment:**
   - Set up Postgres and Redis
   - Add these to `.env`:
     - `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `REDIS_URL`
4. **Run Development Server:**
   ```sh
   npm run dev
   # Visit http://localhost:8080
   ```
5. **Production:**
   ```sh
   npm run build
   npm start
   ```

## Tech Stack
- **Server:** Go
- **Client:** TypeScript + [PhaserJS](https://phaser.io/)
- **Realtime:** WebSockets

## License

[![CC BY 4.0][cc-by-image]][cc-by]

Licensed under [CC BY 4.0][cc-by].

[cc-by]: http://creativecommons.org/licenses/by/4.0/
[cc-by-image]: https://i.creativecommons.org/l/by/4.0/88x31.png

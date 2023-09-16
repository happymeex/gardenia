# Gardenia

This repository contains the source code behind Gardenia,
a browser-based 2D platformer game inspired by Hollow Knight.
You play as a shapeshifting forest spirit who must protect her
home from encroaching robot enemies.

<img src="https://i.imgur.com/7STtkWz.jpg" height="300">
<img src="https://i.imgur.com/qEUJZk4.jpg" height="300">

Gardenia currently supports a survival mode and a brawl mode (multiplayer Smash-style).
Development of a story mode is on indefinite hiatus, but I may revisit it
if enough people show interest.

## Development

The server is written in Go, and the client is written in TypeScript using the [PhaserJS game engine](https://phaser.io/).

To run locally, clone this repository and make sure you have Go and PostgreSQL installed.
Configure a new database in Postgres and populate the environment variables `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`
with the database name, host URL (likely just `localhost`), port number, username, and
password, respectively. (You can put them in a `.env` file
in the root directory.)

Next, run `npm i` and `npm run dev` to start the development server.
It supports hot-module-reloading for the client via vite.
To run in production mode, you can `npm run build` and `npm start`.
Visit `localhost:8080` to play the game.

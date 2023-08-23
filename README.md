# Gardenia

This repository contains the source code behind Gardenia,
a browser-based 2D platformer game inspired by Hollow Knight.
The server is written in Go, and the client is written using the PhaserJS game engine.

Gardenia is currently in development.
The goal is to support survival mode, brawl mode (multiplayer Smash-style),
and eventually a story mode.

## Development

To run locally, install Go, run `npm i`, and run `npm run dev`.
This starts both the Go server and a Vite development server.
HTTP requests for HTML/JS assets are forwarded by the former to the latter.
Visit `localhost:8080` to play the game.

If you do not wish to install Go, you can run `npm start` which should
build and run the game in a Docker image.

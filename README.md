# Tak UI

An alternative implementation of https://github.com/USTakAssociation/playtak-ui/.
This is a full rewrite of the ui functionality built on top of modern web technologies such as:

- React
- TypeScript
- Tailwindcss
- Bun
- TanStack Router + Query
- Vite
- BabylonJS

This client is currently hosted on https://tak.meeshroom.xyz.

## Getting Started

Clone the repository:

```sh
git clone https://github.com/Christian-Schefe/tak-ui.git
cd tak-ui
```

Install Bun (https://bun.sh).

Install dependencies:

```sh
bun i
```

Start the dev server:

```sh
bun run dev
```

Then go to http://localhost:5173.

### With local playtak proxy and local https

A proxy to https://api.playtak.com is running at https://tak.meeshroom.xyz/api with all CORS allowed.

To run the playtak api proxy locally, start the docker container:

```sh
docker compose -f ./deploy/docker-compose.dev.yml up
```

In another shell instance, start the dev server:

```sh
bun run dev -- --host 0.0.0.0
```

Then go to https://localhost (note the presence of https and the absence of a port).

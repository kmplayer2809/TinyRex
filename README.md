# TinyRex

## Run locally

```bash
yarn dev
```

## Test

```bash
yarn test
```

## Build

```bash
yarn build
```

## Docker

Build the production image:

```bash
docker build -t tinyrex:local .
```

Run the container with nginx serving the built app on port 8080:

```bash
docker run --rm -p 8080:80 tinyrex:local
```

Then open http://localhost:8080.

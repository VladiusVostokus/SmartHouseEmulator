# Smart Home Emulator

This repository contains two main components for your Smart Home project:

1. **Hono.js Backend**
2. **Mosquitto MQTT Broker (in Docker)**

## Prerequisites

- Node.js (v18 or newer)
- Docker & Docker Compose

## 1. Configure Environment Variables

1. Copy the sample file:

   ```bash
   cp .env.sample .env
   ```

2. Edit .env and adjust paths if needed.

3. If you plan to enable MQTT authentication, uncomment and set:

   ```bash
   MOSQ_PWFILE_PATH=./infra/mosquitto/config/pwfile
   ```

## 2. Start Mosquitto MQTT Broker

From the project root, run:

```bash
# Launch the broker in detached mode
docker-compose up -d mosquitto
```

To view logs:

```bash
docker-compose logs -f mosquitto
```

To stop the broker:

```bash
docker-compose down
```

## 3. Monorepo Structure

This repository now uses a npm workspace–based monorepo. All of our “packages” live under `packages/`:

```
packages/
├─ common/ ← shared interfaces & utils
│ ├─ src/ ← TypeScript source
│ └─ dist/ ← compiled ESM output
├─ light/ ← Light-device emulator
│ ├─ src/ ← TS source including `Light.ts` & `cli.ts`
│ └─ dist/ ← compiled output + entrypoint `index.js`, `cli.js`
├─ thermostat/ ← Thermostat-device emulator
│ └─ … same layout as `light/` …
└─ server/ ← Hono.js backend
```

At the repo root:

```
infra/ ← Docker & Mosquitto config
docker-compose.yaml
```

## 4. Building & Running Device Emulators

Whenever you add or change code in **any** package, do:

```bash
# from repo root
npm install             # link all workspaces
npm run build           # runs `tsc --build` across packages in correct order
```

### Light emulator

```bash
# build only the Light package
npx tsc --build packages/light

# start the Light device client
npm --prefix packages/light run start
```

### Thermostat emulator

```bash
# build only the Thermostat package
npx tsc --build packages/thermostat

# start the Thermostat device client
npm --prefix packages/thermostat run start
```

### Movement-sensor emulator
```bash
# build only the Light package
npx tsc --build packages/movement-sentor

# start the Light device client
npm --prefix packages/movement-sentor run start
```

### Connecting movement sensor with light

Create link between sensor and light, so light can be turned on when sensor detected movement

Use http://localhost:3000/home/linkdevices endpoint for connecting, send post request with JSON:
```bash
{
    "light": "lightId",
    "sensor": "sensorId"
}
```

To delete link, send delete request to http://localhost:3000/home/deletelink with JSON:
```bash
{
    "sensor": "sensorId"
}
```

## 5. Managing Inter-Package Dependencies (TypeScript Project References)

This monorepo uses TypeScript Project References to manage dependencies between local packages (e.g., `light` depending on `common`). This ensures correct build order and type-checking.

**When to add a reference:**

If package `A` needs to import code from package `B` (both being local packages within `packages/`), you must tell TypeScript about this relationship.

**How to add a reference:**

1.  **Identify the consumer and provider:**

    - Consumer: The package doing the importing (e.g., `packages/light`).
    - Provider: The package being imported from (e.g., `packages/common`).

2.  **Edit the consumer's `tsconfig.json`:**
    Open the `tsconfig.json` file of the _consuming_ package (e.g., `packages/light/tsconfig.json`).

3.  **Add to the `references` array:**
    Add an object specifying the path to the _provider_ package. The path is relative to the consumer's `tsconfig.json`.

    **Example:** If `packages/light` needs to import from `packages/common`:

    ```json
    // In packages/light/tsconfig.json
    {
      "extends": "../../tsconfig.base.json",
      "compilerOptions": {
        "composite": true,
        "rootDir": "src",
        "outDir": "dist"
        // ... other options
      },
      "include": ["src"],
      "exclude": ["node_modules", "dist", "test"],
      "references": [
        { "path": "../common" } // <--- Add this line
        // ... any other existing references
      ]
    }
    ```

4.  **Re-run the build:**
    After adding or changing references, always run the full build from the root:
    ```bash
    npm run build
    ```

**Important Notes on References:**

- **Unidirectional:** Dependencies should generally flow one way (e.g., `light` -> `common`). Avoid circular references (A -> B and B -> A), as TypeScript will error.
- **`composite: true`:** Both the referencing and referenced `tsconfig.json` files must have `"composite": true` in their `compilerOptions`.
- **`declaration: true`:** Referenced projects typically need `"declaration": true` to emit `.d.ts` files.
- **`package.json` Dependencies:** While TypeScript references handle build-time dependencies, ensure you also have the corresponding dependency listed in the consumer's `package.json` (e.g., `"@smart-house/common": "workspace:^"` in `packages/light/package.json`). `npm install` uses this for linking.

## 6. Testing the Setup

1. Subscribe to all topics (in a separate terminal):

```bash
docker exec -it mosquitto \
  mosquitto_sub -h localhost -p 1883 -t '#' -v
```

2. Publish a test MQTT message (in a separate terminal):

```bash
docker exec -it mosquitto \
  mosquitto_pub -h localhost -p 1883 \
    -t 'home/test/motion' \
    -m '{"deviceId":"test","motionDetected":true,"timestamp":"$(date -u +'%Y-%m-%dT%H:%M:%SZ')"}'
```

3. Send a light command via the HTTP API:

```bash
curl -X POST http://localhost:3000/light/hallway-light-1/turnOn
```

You should see the published MQTT messages in the subscriber terminal, and logs in your Hono.js console.

## 7. Code Quality & Testing

### Run ESLint (Code Linting)

Check for code issues:

```bash
npm run lint
```

Automatically fix fixable issues:

```bash
npm run lint:fix
```

### Run Prettier (Code Formatting)

Check formatting:

```bash
npm run format
```

Automatically format code:

```bash
npm run format:fix
```

### Run Tests

Run all tests:

```bash
npm test
```

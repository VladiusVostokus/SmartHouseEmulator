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

## 3. Start Hono.js Backend

1. Install dependencies:

```bash
npm install
```

2. Run in development mode:

```bash
npm run dev
```

By default, the server will start on `http://localhost:3000`

## 4. Testing the Setup

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

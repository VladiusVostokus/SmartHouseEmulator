import { MQTTCommunicator } from "@smart-house/common";
import { MovementSensor } from "./movement-sensor.js";
import type { MovementSensorConfig } from "./interfaces/movement-sensor-config.interface.js";

const clientId = `movement-sensor-${Math.floor(Math.random() * 1000)}`;
const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";

const topicsToSubscribe = [`/home/+/action`, `/home/+/status`];

const communicator = new MQTTCommunicator(
  topicsToSubscribe,
  clientId,
  brokerUrl,
);

const sensorConfig: MovementSensorConfig = {
  minIntervalMs: 5000, // e.g., 5 seconds
  maxIntervalMs: 10000, // e.g., 20 seconds
  detectionProbability: 1, // 30% chance per interval
};

const movementSensor = new MovementSensor(clientId, communicator, sensorConfig);

communicator.listen((topic: string, message: Buffer) => {
  console.log(
    `[CLI] Message received on ${topic} for ${clientId}. Forwarding to sensor.`,
  );
  movementSensor.handleMessage(topic, message);
});

console.log(`[CLI] Movement sensor "${clientId}" initialized and listening.`);
console.log(`[CLI] Simulating device power ON and starting simulation...`);

const turnedOn = movementSensor.turnOn();
if (turnedOn) {
  movementSensor.startSimulation();
}

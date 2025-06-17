import { MQTTCommunicator } from "@smart-house/common";
import { Thermostat } from "./thermostat";

console.log("Starting Thermo Device CLI...");

const instanceId = Math.random().toString(36).substring(2, 7);
const clientId = `thermo-${instanceId}`;
const deviceName = `Thermo-${instanceId}`;

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";

const topicsToSubscribe = [`/home/+/action`, `/home/+/status`];

console.log(`[${deviceName}] Initializing with Client ID: ${clientId}`);
console.log(`[${deviceName}] Connecting to MQTT broker at ${brokerUrl}`);

const communicator = new MQTTCommunicator(
  topicsToSubscribe,
  clientId,
  brokerUrl,
);

const thermo = new Thermostat(deviceName, communicator);

communicator.listen((topic: string, message: Buffer) => {
  console.log(
    `[${deviceName}] CLI: Message received on ${topic}. Forwarding to thermo.`,
  );
  thermo.handleMessage(topic, message);
});

console.log(
  `[${deviceName}] Thermo instance created and listening for commands.`,
);
console.log(
  `[${deviceName}] Simulating device power ON and starting its behavior simulation...`,
);

thermo.turnOn();

console.log(
  `[${deviceName}] Thermo CLI is running. Device name: "${deviceName}", Client ID: "${clientId}".`,
);
console.log(
  `[${deviceName}] Listening for commands on: ${topicsToSubscribe.join(", ")}`,
);
console.log(`[${deviceName}] Press Ctrl+C to exit.`);

process.on("SIGINT", () => {
  console.log(`\n[${deviceName}] SIGINT received. Shutting down thermo...`);
  if (thermo.IsOn) {
    thermo.turnOff();
  }
  console.log(`[${deviceName}] Thermo shutdown complete.`);
  process.exit(0);
});
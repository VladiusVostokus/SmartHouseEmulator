import { MQTTCommunicator } from "@smart-house/common";
import { Light } from "./light";

console.log("Starting Light Device CLI...");

const instanceId = Math.random().toString(36).substring(2, 7);
const clientId = `light-${instanceId}`;
const deviceName = `Light-${instanceId}`;

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";

const topicsToSubscribe = [`/home/+/action`, `/home/+/status`];

console.log(`[${deviceName}] Initializing with Client ID: ${clientId}`);
console.log(`[${deviceName}] Connecting to MQTT broker at ${brokerUrl}`);

const communicator = new MQTTCommunicator(
  topicsToSubscribe,
  clientId,
  brokerUrl,
);

const light = new Light(deviceName, communicator);

communicator.listen((topic: string, message: Buffer) => {
  console.log(
    `[${deviceName}] CLI: Message received on ${topic}. Forwarding to light.`,
  );
  light.handleMessage(topic, message);
});

console.log(
  `[${deviceName}] Light instance created and listening for commands.`,
);
console.log(
  `[${deviceName}] Simulating device power ON and starting its behavior simulation...`,
);

//light.turnOn();

console.log(
  `[${deviceName}] Light CLI is running. Device name: "${deviceName}", Client ID: "${clientId}".`,
);
console.log(
  `[${deviceName}] Listening for commands on: ${topicsToSubscribe.join(", ")}`,
);
console.log(`[${deviceName}] Press Ctrl+C to exit.`);

process.on("SIGINT", () => {
  console.log(`\n[${deviceName}] SIGINT received. Shutting down light...`);
  if (light.isOn) {
    light.turnOff();
  }
  console.log(`[${deviceName}] Light shutdown complete.`);
  process.exit(0);
});

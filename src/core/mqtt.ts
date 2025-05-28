// src/mqtt.ts
import mqtt from "mqtt";
import type { MessagePayload, LightAction, ThermostatAction } from "./types";

const brokerUrl = "mqtt://localhost:1883";
const client = mqtt.connect(brokerUrl);

// Базові топики
const topics = {
  command: '/home/{deviceId}/command',
  status: '/home/{deviceId}/status',
  action: '/home/{deviceId}/action'
};

client.on("connect", () => {
  console.log("✅ Connected to Mosquitto MQTT broker");
});

client.on("message", (topic, message) => {
  console.log(`📩 MQTT message on ${topic}:`, message.toString());
  // Тут можна додати обробку повідомлень
});

// Функції для світла
export function sendLightCommand(
  deviceId: string,
  action: LightAction,
) {
  const payload = JSON.stringify({
    action,
    timestamp: new Date().toISOString(),
  });
  const topic = topics.command.replace('{deviceId}', deviceId);
  client.publish(topic, payload, { qos: 1 });
  console.log(`🚀 Sent light command to ${topic}: ${payload}`);
}

export function subscribeToLight(deviceId: string, callback: (message: MessagePayload) => void) {
  const topic = topics.command.replace('{deviceId}', deviceId);
  client.subscribe(topic, (err) => {
    if (err) {
      console.error(`Error subscribing to ${topic}:`, err);
    } else {
      console.log(`Subscribed to ${topic}`);
    }
  });
}

// Функції для термостата
export function sendThermostatCommand(
  deviceId: string,
  action: ThermostatAction,
  temperature?: number
) {
  const payload = JSON.stringify({
    action,
    temperature,
    timestamp: new Date().toISOString(),
  });
  const topic = topics.command.replace('{deviceId}', deviceId);
  client.publish(topic, payload, { qos: 1 });
  console.log(`🚀 Sent thermostat command to ${topic}: ${payload}`);
}

export function subscribeToThermostat(deviceId: string, callback: (message: MessagePayload) => void) {
  const topic = topics.command.replace('{deviceId}', deviceId);
  client.subscribe(topic, (err) => {
    if (err) {
      console.error(`Error subscribing to ${topic}:`, err);
    } else {
      console.log(`Subscribed to ${topic}`);
    }
  });
}

// Загальні функції
export function publishStatus(deviceId: string, status: MessagePayload) {
  const topic = topics.status.replace('{deviceId}', deviceId);
  const payload = JSON.stringify({
    ...status,
    timestamp: new Date().toISOString()
  });
  client.publish(topic, payload, { qos: 1 });
  console.log(`📤 Published status to ${topic}: ${payload}`);
}

export function subscribeToStatus(deviceId: string, callback: (message: MessagePayload) => void) {
  const topic = topics.status.replace('{deviceId}', deviceId);
  client.subscribe(topic, (err) => {
    if (err) {
      console.error(`Error subscribing to ${topic}:`, err);
    } else {
      console.log(`Subscribed to ${topic}`);
    }
  });
}
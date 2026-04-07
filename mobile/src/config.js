import { Platform } from "react-native";

const LOCAL_IP = "192.168.1.100";

export const API_BASE_URL =
  Platform.OS === "android"
    ? `http://${LOCAL_IP}:3001`
    : `http://${LOCAL_IP}:3001`;

export const API_SETUP_NOTE =
  "Update mobile/src/config.js with your computer's local network IP before testing on a phone or simulator.";

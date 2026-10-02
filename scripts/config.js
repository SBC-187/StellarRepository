import fs from "fs";
import { Horizon, Networks, Asset } from "@stellar/stellar-sdk";

// ---- Parámetros del proyecto inmobiliario (editables) ----
export const PROYECTO = {
  nombre: "Torre Demo Escazu",     // máx. 64 bytes (se guarda on-chain)
  codigoLadrillo: "LADRILLO",      // código del token (máx. 12 caracteres alfanuméricos)
  totalLadrillos: "1000",          // suministro total del proyecto
  precioXlmPorLadrillo: 10,        // precio de cada ladrillo en XLM (testnet)
  fijarSuministro: true,           // true = bloquea al emisor, nunca se podrán crear más ladrillos
};

// ---- Red ----
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const NETWORK = Networks.TESTNET;
export const server = new Horizon.Server(HORIZON_URL);

// ---- Llaves locales (SOLO para testnet, nunca subir a GitHub) ----
const KEYS_FILE = ".keys.json";

export function guardarLlaves(llaves) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(llaves, null, 2));
}

export function cargarLlaves() {
  if (!fs.existsSync(KEYS_FILE)) {
    throw new Error("No existe .keys.json. Corré primero: npm run setup");
  }
  return JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));
}

export function activoLadrillo(publicKeyEmisor) {
  return new Asset(PROYECTO.codigoLadrillo, publicKeyEmisor);
}

export function explorer(txHash) {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

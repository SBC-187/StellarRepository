// Copia las llaves PÚBLICAS de .keys.json a js/config.js para que el sitio lea datos reales de testnet.
// Uso: node scripts/05-config-web.js
import fs from "fs";
import { PROYECTO, HORIZON_URL, cargarLlaves } from "./config.js";

const llaves = cargarLlaves();
const config = {
  horizon: HORIZON_URL,
  emisor: llaves.emisor.publicKey,
  distribuidor: llaves.distribuidor.publicKey,
  codigo: PROYECTO.codigoLadrillo,
  total: Number(PROYECTO.totalLadrillos),
  precioXlm: PROYECTO.precioXlmPorLadrillo,
};

fs.mkdirSync("js", { recursive: true });
fs.writeFileSync(
  "js/config.js",
  `// Generado por scripts/05-config-web.js (solo llaves públicas)\nwindow.BRICKCHAIN_CONFIG = ${JSON.stringify(config, null, 2)};\n`
);
console.log("✔ js/config.js actualizado. El sitio ahora lee datos reales de Stellar testnet.");

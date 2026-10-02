// Crea y fondea (con Friendbot) las cuentas de la demo:
// - emisor:       crea los ladrillos del proyecto
// - distribuidor: la plataforma BrickChain, guarda y vende los ladrillos
// - inversionista: un usuario de prueba que compra ladrillos
import { Keypair } from "@stellar/stellar-sdk";
import { FRIENDBOT_URL, guardarLlaves } from "./config.js";

const roles = ["emisor", "distribuidor", "inversionista"];
const llaves = {};

for (const rol of roles) {
  const kp = Keypair.random();
  const res = await fetch(`${FRIENDBOT_URL}?addr=${kp.publicKey()}`);
  if (!res.ok) throw new Error(`Friendbot falló para ${rol}: ${res.status}`);
  llaves[rol] = { publicKey: kp.publicKey(), secret: kp.secret() };
  console.log(`✔ ${rol.padEnd(13)} ${kp.publicKey()}`);
}

guardarLlaves(llaves);
console.log("\nLlaves guardadas en .keys.json (está en .gitignore).");

// Muestra cuántos ladrillos y XLM tiene cada cuenta.
import { server, PROYECTO, cargarLlaves } from "./config.js";

const llaves = cargarLlaves();

for (const [rol, { publicKey }] of Object.entries(llaves)) {
  const cuenta = await server.loadAccount(publicKey);
  const xlm = cuenta.balances.find((b) => b.asset_type === "native")?.balance ?? "0";
  const ladrillos = cuenta.balances.find(
    (b) => b.asset_code === PROYECTO.codigoLadrillo && b.asset_issuer === llaves.emisor.publicKey
  )?.balance ?? "0";
  console.log(`${rol.padEnd(13)} | ${PROYECTO.codigoLadrillo}: ${ladrillos.padStart(14)} | XLM: ${xlm}`);
}

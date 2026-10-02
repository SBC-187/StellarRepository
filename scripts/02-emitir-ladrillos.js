// Emite los ladrillos del proyecto y los envía al distribuidor (la plataforma).
import { Keypair, TransactionBuilder, Operation, BASE_FEE } from "@stellar/stellar-sdk";
import { server, NETWORK, PROYECTO, cargarLlaves, activoLadrillo, explorer } from "./config.js";

const llaves = cargarLlaves();
const emisor = Keypair.fromSecret(llaves.emisor.secret);
const distribuidor = Keypair.fromSecret(llaves.distribuidor.secret);
const ladrillo = activoLadrillo(emisor.publicKey());

const cuentaEmisor = await server.loadAccount(emisor.publicKey());

const builder = new TransactionBuilder(cuentaEmisor, { fee: BASE_FEE, networkPassphrase: NETWORK })
  // 1. Metadatos del proyecto guardados en la cuenta del emisor
  .addOperation(Operation.manageData({ name: "proyecto", value: PROYECTO.nombre }))
  // 2. El distribuidor acepta recibir ladrillos (trustline)
  .addOperation(Operation.changeTrust({ asset: ladrillo, source: distribuidor.publicKey() }))
  // 3. El emisor crea los ladrillos al enviarlos al distribuidor
  .addOperation(Operation.payment({
    destination: distribuidor.publicKey(),
    asset: ladrillo,
    amount: PROYECTO.totalLadrillos,
  }));

// 4. Opcional: bloquear al emisor para que el suministro quede fijo
if (PROYECTO.fijarSuministro) {
  builder.addOperation(Operation.setOptions({ masterWeight: 0 }));
}

const tx = builder.setTimeout(60).build();
tx.sign(emisor, distribuidor);

const res = await server.submitTransaction(tx);
console.log(`✔ Emitidos ${PROYECTO.totalLadrillos} ${PROYECTO.codigoLadrillo} para "${PROYECTO.nombre}"`);
console.log(`  Ver transacción: ${explorer(res.hash)}`);

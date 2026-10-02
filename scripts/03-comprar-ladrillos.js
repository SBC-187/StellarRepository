// El inversionista compra N ladrillos pagando XLM.
// Todo ocurre en UNA transacción atómica: o se paga y se reciben los ladrillos, o no pasa nada.
// Uso: npm run comprar -- 5
import { Keypair, TransactionBuilder, Operation, Asset, BASE_FEE } from "@stellar/stellar-sdk";
import { server, NETWORK, PROYECTO, cargarLlaves, activoLadrillo, explorer } from "./config.js";

const cantidad = Number(process.argv[2] ?? 1);
if (!Number.isInteger(cantidad) || cantidad <= 0) {
  throw new Error("La cantidad debe ser un número entero mayor a 0");
}

const llaves = cargarLlaves();
const inversionista = Keypair.fromSecret(llaves.inversionista.secret);
const distribuidor = Keypair.fromSecret(llaves.distribuidor.secret);
const ladrillo = activoLadrillo(llaves.emisor.publicKey);
const totalXlm = (cantidad * PROYECTO.precioXlmPorLadrillo).toFixed(7);

const cuentaInversionista = await server.loadAccount(inversionista.publicKey());
const yaTieneTrustline = cuentaInversionista.balances.some(
  (b) => b.asset_code === PROYECTO.codigoLadrillo && b.asset_issuer === llaves.emisor.publicKey
);

const builder = new TransactionBuilder(cuentaInversionista, { fee: BASE_FEE, networkPassphrase: NETWORK });

// 1. El inversionista acepta recibir ladrillos (solo la primera vez)
if (!yaTieneTrustline) builder.addOperation(Operation.changeTrust({ asset: ladrillo }));

const tx = builder
  // 2. El inversionista paga en XLM a la plataforma
  .addOperation(Operation.payment({
    destination: distribuidor.publicKey(),
    asset: Asset.native(),
    amount: totalXlm,
  }))
  // 3. La plataforma entrega los ladrillos al inversionista
  .addOperation(Operation.payment({
    source: distribuidor.publicKey(),
    destination: inversionista.publicKey(),
    asset: ladrillo,
    amount: String(cantidad),
  }))
  .setTimeout(60)
  .build();

// En el MVP ambos firman aquí. En producción, el inversionista firma con su wallet (Freighter)
// y la plataforma firma en el backend.
tx.sign(inversionista, distribuidor);

const res = await server.submitTransaction(tx);
console.log(`✔ Compra exitosa: ${cantidad} ${PROYECTO.codigoLadrillo} por ${totalXlm} XLM`);
console.log(`  Ver transacción: ${explorer(res.hash)}`);

# BrickChain MVP – Stellar Testnet

BrickChain divide un proyecto inmobiliario en unidades digitales llamadas **ladrillos**. Cada ladrillo es un token en Stellar que representa una participación económica en el proyecto.

## Cómo funciona

| Cuenta | Representa |
|---|---|
| Emisor | El proyecto inmobiliario; crea los ladrillos |
| Distribuidor | La plataforma BrickChain; guarda y vende los ladrillos |
| Inversionista | Un usuario que compra ladrillos con XLM |

1. Se crean las tres cuentas en testnet (fondeadas con Friendbot).
2. El emisor crea el suministro total de ladrillos y lo envía a la plataforma. Opcionalmente se bloquea al emisor para que nunca se puedan crear más.
3. El inversionista compra ladrillos en una transacción atómica: paga XLM y recibe los ladrillos en el mismo paso.
4. Todo es verificable públicamente en el explorador de Stellar.

## Requisitos

- Node.js 18 o superior

## Uso

```bash
npm install
npm run setup         # crea y fondea las cuentas
npm run emitir        # emite los ladrillos del proyecto
npm run comprar -- 5  # el inversionista compra 5 ladrillos
npm run balances      # muestra los saldos de cada cuenta
```

Los parámetros del proyecto (nombre, código del token, total y precio) se editan en `scripts/config.js`.

> Las llaves se guardan en `.keys.json`, que está en `.gitignore`. Son solo de testnet; nunca suban llaves reales al repositorio.

## Próximos pasos

- [ ] Frontend web con conexión a la wallet Freighter
- [ ] Varios proyectos inmobiliarios (un código de ladrillo por proyecto)
- [ ] Contrato Soroban para distribuir rendimientos entre los dueños de ladrillos

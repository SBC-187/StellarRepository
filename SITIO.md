# Sitio web de BrickChain

Sitio estático (HTML, CSS y JavaScript, sin compilación) para mostrar BrickChain al usuario final.

## Páginas
- **Inicio:** qué es BrickChain, comparación con la inversión tradicional, cómo funciona y por qué blockchain.
- **Proyectos:** catálogo de proyectos inmobiliarios.
- **Detalle de proyecto:** muro de ladrillos vendidos, calculadora de inversión, compra simulada y últimas compras.
- **Mi portafolio:** ladrillos comprados, inversión total e ingreso estimado.

## Abrirlo
Abrí `index.html` en el navegador, o mejor con la extensión **Live Server** de VS Code (clic derecho en index.html → Open with Live Server).

## Conectarlo con Stellar testnet
```bash
node scripts/05-config-web.js
```
Esto copia las llaves **públicas** de `.keys.json` a `js/config.js`. Desde ahí, el proyecto "Torre Demo Escazú" muestra los ladrillos vendidos y las compras reales de testnet.

## Editar contenido
- Proyectos, precios y textos: `js/data.js`
- Colores y tipografía: variables al inicio de `css/styles.css`

Las compras hechas desde el sitio son simuladas y se guardan en el navegador. El botón "Vaciar compras de demo" en Mi portafolio las borra.

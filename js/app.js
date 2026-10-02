(function () {
  "use strict";

  const CONFIG = window.BRICKCHAIN_CONFIG || {};
  const PROYECTOS = window.BRICKCHAIN_PROYECTOS || [];
  const VIVO_ACTIVO = Boolean(CONFIG.emisor && CONFIG.distribuidor);
  const app = document.getElementById("app");

  // ---------- Formato ----------
  const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = new Intl.NumberFormat("es-CR");
  const pct = (v, d = 1) => (v * 100).toLocaleString("es-CR", { maximumFractionDigits: d }) + " %";
  const corta = (cuenta) => cuenta ? `${cuenta.slice(0, 4)}…${cuenta.slice(-4)}` : "";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  function hace(fecha) {
    const seg = Math.min(0, Math.round((new Date(fecha) - Date.now()) / 1000));
    const abs = Math.abs(seg);
    if (abs < 60) return rtf.format(seg, "second");
    if (abs < 3600) return rtf.format(Math.round(seg / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(seg / 3600), "hour");
    return rtf.format(Math.round(seg / 86400), "day");
  }

  // ---------- Almacenamiento local (compras simuladas) ----------
  const CLAVE = "brickchain:compras-demo";
  function leerCompras() {
    try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch { return []; }
  }
  function guardarCompras(lista) {
    try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch { /* sin almacenamiento: solo en memoria */ }
    estado.compras = lista;
  }

  const estado = {
    compras: leerCompras(),
    cantidad: {},
    vivo: { cargando: false, cargado: false, vendidos: 0, ventas: [], error: null, actualizado: null }
  };

  // ---------- Cálculos ----------
  const proyecto = (id) => PROYECTOS.find((p) => p.id === id);
  const misLadrillos = (id) => estado.compras.filter((c) => c.id === id).reduce((s, c) => s + c.cantidad, 0);
  function vendidosBase(p) {
    if (p.enVivo && VIVO_ACTIVO) return estado.vivo.cargado ? estado.vivo.vendidos : 0;
    return p.vendidos;
  }
  const totalDe = (p) => (p.enVivo && VIVO_ACTIVO ? Number(CONFIG.total) || p.total : p.total);
  const vendidosDe = (p) => Math.min(totalDe(p), vendidosBase(p) + misLadrillos(p.id));
  const disponiblesDe = (p) => totalDe(p) - vendidosDe(p);
  const estaEnVivo = (p) => p.enVivo && VIVO_ACTIVO;

  // ---------- Lectura de Stellar testnet ----------
  async function cargarVivo() {
    if (!VIVO_ACTIVO || estado.vivo.cargando) return;
    estado.vivo.cargando = true;
    const base = (CONFIG.horizon || "https://horizon-testnet.stellar.org").replace(/\/$/, "");
    try {
      const [cuentaRes, pagosRes] = await Promise.all([
        fetch(`${base}/accounts/${CONFIG.distribuidor}`),
        fetch(`${base}/accounts/${CONFIG.distribuidor}/payments?order=desc&limit=50`)
      ]);
      if (!cuentaRes.ok) throw new Error(`La cuenta de la plataforma no existe en testnet (${cuentaRes.status}).`);
      const cuenta = await cuentaRes.json();
      const saldo = cuenta.balances.find((b) => b.asset_code === CONFIG.codigo && b.asset_issuer === CONFIG.emisor);
      const total = Number(CONFIG.total);
      estado.vivo.vendidos = saldo ? Math.max(0, Math.round(total - parseFloat(saldo.balance))) : 0;

      const pagos = pagosRes.ok ? (await pagosRes.json())._embedded.records : [];
      estado.vivo.ventas = pagos
        .filter((r) => r.type === "payment" && r.asset_code === CONFIG.codigo && r.asset_issuer === CONFIG.emisor && r.from === CONFIG.distribuidor)
        .map((r) => ({ cuenta: r.to, cantidad: parseFloat(r.amount), fecha: r.created_at, hash: r.transaction_hash }));

      estado.vivo.error = null;
      estado.vivo.cargado = true;
      estado.vivo.actualizado = new Date();
    } catch (e) {
      estado.vivo.error = e.message || "No se pudo conectar con Stellar testnet.";
    } finally {
      estado.vivo.cargando = false;
      render();
    }
  }

  // ---------- Componentes ----------
  function muro(total, vendidos, mios, columnas, clase = "") {
    const filas = Math.ceil(total / columnas);
    const margen = `calc(100% / ${columnas * 2 + 1})`;
    let html = `<div class="muro ${clase}" role="img" aria-label="${num.format(vendidos)} de ${num.format(total)} ladrillos vendidos${mios ? `, ${num.format(mios)} son tuyos` : ""}">`;
    let i = 0;
    for (let f = 0; f < filas; f++) {
      const lado = f % 2 ? "padding-left" : "padding-right";
      html += `<div class="hilada" style="${lado}:${margen}">`;
      for (let c = 0; c < columnas; c++, i++) {
        if (i >= total) { html += `<span class="ladrillo" style="visibility:hidden"></span>`; continue; }
        const tipo = i < vendidos - mios ? "lleno" : i < vendidos ? "mio" : "";
        html += `<span class="ladrillo ${tipo}"></span>`;
      }
      html += `</div>`;
    }
    return html + `</div>`;
  }

  function muroHero() {
    const columnas = 14, filas = 9, llenos = 96;
    let html = `<div class="muro muro-hero" aria-hidden="true">`;
    let i = 0;
    for (let f = 0; f < filas; f++) {
      const lado = f % 2 ? "padding-left" : "padding-right";
      html += `<div class="hilada" style="${lado}:calc(100% / ${columnas * 2 + 1})">`;
      for (let c = 0; c < columnas; c++, i++) {
        html += i < llenos
          ? `<span class="ladrillo lleno" style="--d:${(i * 0.018).toFixed(3)}s"></span>`
          : `<span class="ladrillo"></span>`;
      }
      html += `</div>`;
    }
    return html + `</div>`;
  }

  // Ilustración tipo plano: el edificio se "llena" según el % de ladrillos vendidos
  function ilustracion(p) {
    const W = 320, H = 200, piso = 178;
    const avance = vendidosDe(p) / totalDe(p);
    let cuerpo = "", ancho, alto, x;
    if (p.tipo === "Logístico") {
      ancho = 230; alto = 70; x = (W - ancho) / 2;
      cuerpo += `<path d="M${x} ${piso} V${piso - alto + 14} L${x + 57} ${piso - alto} L${x + 115} ${piso - alto + 14} L${x + 172} ${piso - alto} L${x + ancho} ${piso - alto + 14} V${piso} Z" />`;
      for (let d = 0; d < 6; d++) cuerpo += `<rect x="${x + 14 + d * 36}" y="${piso - 30}" width="24" height="30" />`;
    } else {
      ancho = p.pisos > 8 ? 96 : 170;
      const alturaPiso = Math.min(150 / p.pisos, 22);
      alto = alturaPiso * p.pisos; x = (W - ancho) / 2;
      cuerpo += `<rect x="${x}" y="${piso - alto}" width="${ancho}" height="${alto}" />`;
      const ventanas = Math.floor(ancho / 19);
      const paso = ancho / ventanas;
      for (let k = 0; k < p.pisos; k++) {
        const y = piso - alto + k * alturaPiso;
        if (k > 0) cuerpo += `<line x1="${x}" y1="${y}" x2="${x + ancho}" y2="${y}" />`;
        for (let v = 0; v < ventanas; v++) {
          cuerpo += `<rect x="${(x + v * paso + paso * 0.28).toFixed(1)}" y="${(y + alturaPiso * 0.28).toFixed(1)}" width="${(paso * 0.44).toFixed(1)}" height="${(alturaPiso * 0.44).toFixed(1)}" />`;
        }
      }
    }
    const altoRelleno = (alto + 2) * avance;
    const clip = `clip-${p.id}`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ilustración de ${esc(p.nombre)}, ${pct(avance, 0)} financiado">
      <defs>
        <pattern id="grilla-${p.id}" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#ffffff" stroke-opacity=".08"/></pattern>
        <clipPath id="${clip}"><rect x="0" y="${piso - altoRelleno}" width="${W}" height="${altoRelleno}"/></clipPath>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#grilla-${p.id})"/>
      <g fill="#B84A32" stroke="none" clip-path="url(#${clip})" opacity=".9">${cuerpo.replace(/<line[^>]*\/>/g, "")}</g>
      <g fill="none" stroke="#F7F8F6" stroke-width="1.2" opacity=".9">${cuerpo}</g>
      <line x1="16" y1="${piso}" x2="${W - 16}" y2="${piso}" stroke="#F7F8F6" stroke-width="1.5"/>
    </svg>`;
  }

  function etiquetas(p) {
    return `<div class="etiquetas">
      ${estaEnVivo(p) ? `<span class="etiqueta vivo">En vivo en Stellar</span>` : ""}
      <span class="etiqueta">${esc(p.tipo)}</span>
      <span class="etiqueta">${esc(p.estado)}</span>
    </div>`;
  }

  function progreso(p) {
    const v = vendidosDe(p), t = totalDe(p);
    return `<div>
      <div class="progreso"><span style="width:${(v / t) * 100}%"></span></div>
      <div class="progreso-texto"><span>${num.format(v)} de ${num.format(t)} ladrillos vendidos</span><span>${pct(v / t, 0)}</span></div>
    </div>`;
  }

  function tarjeta(p) {
    return `<a class="tarjeta" href="#/proyecto/${p.id}">
      <div class="tarjeta-ilustracion">${ilustracion(p)}</div>
      <div class="tarjeta-cuerpo">
        ${etiquetas(p)}
        <h3>${esc(p.nombre)}</h3>
        <p class="ubicacion">${esc(p.ubicacion)}</p>
        <dl class="cifras">
          <div><dt>Por ladrillo</dt><dd>${usd.format(p.precioUsd)}</dd></div>
          <div><dt>Rendimiento est.</dt><dd>${pct(p.rendimiento)}</dd></div>
          <div><dt>Plazo</dt><dd>${p.plazoMeses} meses</dd></div>
        </dl>
        ${progreso(p)}
        <span class="tarjeta-ver">Ver proyecto</span>
      </div>
    </a>`;
  }

  function avisoVivo() {
    if (!VIVO_ACTIVO) return "";
    if (estado.vivo.error) return `<div class="vacio" role="status"><p><strong>No se pudo leer Stellar testnet.</strong> ${esc(estado.vivo.error)}</p><p>Revisa las llaves en js/config.js o tu conexión a internet.</p><button class="boton chico secundario" data-accion="actualizar">Intentar de nuevo</button></div>`;
    return "";
  }

  // ---------- Vistas ----------
  function vistaInicio() {
    const p = PROYECTOS[0];
    const vivo = p && estaEnVivo(p);
    return `
    <div class="contenedor">
      <section class="hero">
        <div>
          <h1>Sé dueño de una parte del edificio, ladrillo por ladrillo.</h1>
          <p class="bajada">BrickChain divide proyectos inmobiliarios de Costa Rica en ladrillos digitales. Cada ladrillo es una participación real del proyecto y puedes empezar desde ${usd.format(50)}.</p>
          <div class="acciones">
            <a class="boton primario" href="#/proyectos">Ver proyectos</a>
            <a class="boton secundario" href="#/como-funciona">Cómo funciona</a>
          </div>
        </div>
        <figure class="hero-muro">
          ${muroHero()}
          <figcaption>${vivo && estado.vivo.cargado
            ? `<strong>${esc(p.nombre)}:</strong> ${num.format(vendidosDe(p))} de ${num.format(totalDe(p))} ladrillos vendidos, registrados en Stellar.`
            : `Cada rectángulo es un ladrillo: una fracción de ${usd.format(50)} de un proyecto inmobiliario.`}</figcaption>
        </figure>
      </section>

      <section class="comparacion" aria-label="Inversión tradicional frente a BrickChain">
        <div>
          <p class="titulo">Comprar una propiedad para alquilar</p>
          <p class="monto">${usd.format(120000)}+</p>
          <p>Prima, préstamo, trámites y años de compromiso. Fuera del alcance de la mayoría.</p>
        </div>
        <div>
          <p class="titulo">Participar con BrickChain</p>
          <p class="monto">${usd.format(50)}</p>
          <p>Compras los ladrillos que quieras y recibes tu parte de los ingresos del proyecto.</p>
        </div>
      </section>

      <section class="seccion" id="como-funciona">
        <h2>Cómo funciona</h2>
        <ol class="pasos">
          <li><h3>Elige un proyecto</h3><p>Revisa ubicación, plazo y rendimiento estimado de cada desarrollo inmobiliario.</p></li>
          <li><h3>Compra tus ladrillos</h3><p>Cada ladrillo es un token en la red Stellar. El pago y la entrega ocurren en una sola transacción.</p></li>
          <li><h3>Recibe tu parte</h3><p>Los ingresos por alquiler o venta se reparten según cuántos ladrillos tengas.</p></li>
        </ol>
      </section>

      <section class="seccion">
        <div class="seccion-encabezado">
          <h2>Proyectos abiertos</h2>
          <a href="#/proyectos">Ver todos</a>
        </div>
        <div class="proyectos">${PROYECTOS.map(tarjeta).join("")}</div>
      </section>

      <section class="seccion">
        <h2>Por qué en blockchain</h2>
        <div class="garantias">
          <div class="garantia"><h3>Nadie puede crear más ladrillos</h3><p>El total de cada proyecto se fija al emitirlo. La cuenta emisora queda bloqueada y tu porcentaje no se diluye.</p></div>
          <div class="garantia"><h3>Pagas y recibes al mismo tiempo</h3><p>La compra es atómica: o recibes tus ladrillos y se cobra el pago, o no pasa nada.</p></div>
          <div class="garantia"><h3>Todo es verificable</h3><p>Cualquiera puede revisar en el explorador público de Stellar cuántos ladrillos existen y quién los tiene.</p></div>
        </div>
        ${vivo && estado.vivo.cargado ? `
        <div class="panel-vivo">
          <div class="dato"><strong>${num.format(totalDe(p))}</strong>ladrillos emitidos</div>
          <div class="dato"><strong>${num.format(estado.vivo.vendidos)}</strong>vendidos en testnet</div>
          <a href="https://stellar.expert/explorer/testnet/account/${esc(CONFIG.emisor)}" target="_blank" rel="noopener">Ver el emisor en Stellar Expert</a>
        </div>` : avisoVivo()}
      </section>
    </div>`;
  }

  function vistaProyectos() {
    return `<div class="contenedor seccion" style="padding-top:48px">
      <div class="seccion-encabezado">
        <div><h1>Proyectos</h1><p>Desarrollos inmobiliarios abiertos a inversión por ladrillos.</p></div>
      </div>
      ${avisoVivo()}
      <div class="proyectos">${PROYECTOS.map(tarjeta).join("")}</div>
    </div>`;
  }

  function filasVentas(p) {
    const mias = estado.compras.filter((c) => c.id === p.id).map((c) => ({ cuenta: "Tú", cantidad: c.cantidad, fecha: c.fecha, simulada: true }));
    let externas = [];
    if (estaEnVivo(p)) externas = estado.vivo.ventas;
    else {
      const cuentas = ["GBX4Q7LM", "GCT2W9RA", "GDLK8E3P", "GAZ7M1VN", "GCQ3H6TU"];
      const cantidades = [12, 3, 25, 6, 40];
      externas = cuentas.map((c, k) => ({ cuenta: c.slice(0, 4) + "…" + c.slice(-4), cantidad: cantidades[k], fecha: new Date(Date.now() - (k + 1) * 5.3e6).toISOString(), demo: true }));
    }
    const todas = [...mias, ...externas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8);
    if (!todas.length) {
      return `<div class="vacio"><p>Todavía no hay compras en este proyecto.</p><p>Compra ladrillos con el simulador o corre <code>npm run comprar -- 5</code> y presiona Actualizar.</p></div>`;
    }
    return `<ul class="transacciones">${todas.map((t) => `
      <li>
        <span class="quien">${t.simulada ? "Tú <span class=\"sim\">(simulación)</span>" : esc(t.demo ? t.cuenta : corta(t.cuenta))}</span>
        <span><strong>${num.format(t.cantidad)}</strong> ${t.cantidad === 1 ? "ladrillo" : "ladrillos"}</span>
        <span class="cuando">${t.hash ? `<a href="https://stellar.expert/explorer/testnet/tx/${esc(t.hash)}" target="_blank" rel="noopener">${hace(t.fecha)}</a>` : hace(t.fecha)}</span>
      </li>`).join("")}</ul>`;
  }

  function vistaProyecto(id) {
    const p = proyecto(id);
    if (!p) return `<div class="contenedor seccion" style="padding-top:48px"><h1>Este proyecto no existe</h1><p>Revisa el enlace o vuelve a la lista de proyectos.</p><a class="boton" href="#/proyectos">Ver proyectos</a></div>`;
    const disponibles = disponiblesDe(p);
    const cant = Math.max(1, Math.min(estado.cantidad[p.id] || 10, Math.max(disponibles, 1)));
    estado.cantidad[p.id] = cant;
    const mios = misLadrillos(p.id);
    const columnas = totalDe(p) >= 1000 ? 40 : 32;

    return `<div class="contenedor">
      <p class="migas"><a href="#/proyectos">Proyectos</a> / ${esc(p.nombre)}</p>
      <div class="detalle-cabecera">
        <div>
          ${etiquetas(p)}
          <h1 style="margin-top:14px">${esc(p.nombre)}</h1>
          <p class="ubicacion" style="color:var(--tenue)">${esc(p.ubicacion)}</p>
          <div class="ilustracion">${ilustracion(p)}</div>
          <p>${esc(p.descripcion)}</p>
          <dl class="ficha">
            <div><dt>Precio por ladrillo</dt><dd>${usd.format(p.precioUsd)}</dd></div>
            <div><dt>Rendimiento estimado</dt><dd>${pct(p.rendimiento)} anual</dd></div>
            <div><dt>Plazo</dt><dd>${p.plazoMeses} meses</dd></div>
            <div><dt>Disponibles</dt><dd>${num.format(disponibles)}</dd></div>
          </dl>
        </div>

        <aside class="simulador" aria-labelledby="sim-titulo">
          <h2 id="sim-titulo">Calcula tu inversión</h2>
          <label for="cantidad">Ladrillos a comprar</label>
          <div class="cantidad">
            <button type="button" data-accion="menos" aria-label="Quitar un ladrillo">−</button>
            <input id="cantidad" type="number" inputmode="numeric" min="1" max="${disponibles}" value="${cant}" ${disponibles ? "" : "disabled"} />
            <button type="button" data-accion="mas" aria-label="Agregar un ladrillo">+</button>
          </div>
          <input type="range" id="rango" min="1" max="${Math.max(1, Math.min(disponibles, 200))}" value="${Math.min(cant, 200)}" aria-label="Ajustar cantidad de ladrillos" ${disponibles ? "" : "disabled"} />
          <dl class="resultado" id="resultado"></dl>
          <button class="boton primario" data-accion="comprar" ${disponibles ? "" : "disabled"} id="boton-comprar"></button>
          <p class="nota">${disponibles ? "Los rendimientos son estimados y pueden variar." : "Este proyecto ya vendió todos sus ladrillos."}</p>
        </aside>
      </div>

      <section class="bloque">
        <div class="bloque-encabezado">
          <h2>Ladrillos del proyecto</h2>
          <p>${num.format(vendidosDe(p))} de ${num.format(totalDe(p))} vendidos${mios ? `, ${num.format(mios)} son tuyos` : ""}</p>
        </div>
        <div class="detalle-muro">
          ${muro(totalDe(p), vendidosDe(p), mios, columnas)}
          <div class="leyenda">
            <span><i class="lleno"></i>Vendido</span>
            ${mios ? `<span><i class="mio"></i>Tuyo</span>` : ""}
            <span><i></i>Disponible</span>
          </div>
        </div>
      </section>

      <section class="bloque" style="padding-bottom:88px">
        <div class="bloque-encabezado">
          <h2>Últimas compras</h2>
          ${estaEnVivo(p) ? `<button class="boton chico secundario" data-accion="actualizar">${estado.vivo.cargando ? "Actualizando…" : "Actualizar"}</button>` : ""}
        </div>
        ${avisoVivo()}
        ${filasVentas(p)}
        ${estaEnVivo(p) && estado.vivo.actualizado ? `<p class="nota" style="color:var(--tenue);font-size:.85rem;margin-top:12px">Datos leídos de Stellar testnet ${hace(estado.vivo.actualizado)}. Cada fecha enlaza a su transacción.</p>` : ""}
      </section>
    </div>`;
  }

  function actualizarSimulador(p) {
    const cant = estado.cantidad[p.id];
    const res = document.getElementById("resultado");
    const boton = document.getElementById("boton-comprar");
    if (!res) return;
    const inversion = cant * p.precioUsd;
    res.innerHTML = `
      <div><dt>Inversión</dt><dd>${usd.format(inversion)}</dd></div>
      <div><dt>Tu participación</dt><dd>${pct(cant / totalDe(p), 2)} del proyecto</dd></div>
      <div><dt>Ingreso estimado al año</dt><dd>${usd2.format(inversion * p.rendimiento)}</dd></div>
      ${estaEnVivo(p) ? `<div><dt>Pago en testnet</dt><dd>${num.format(cant * (CONFIG.precioXlm || 10))} XLM</dd></div>` : ""}
      <div class="total"><dt>Total</dt><dd>${usd.format(inversion)}</dd></div>`;
    if (boton && !boton.disabled) boton.textContent = `Comprar ${num.format(cant)} ${cant === 1 ? "ladrillo" : "ladrillos"}`;
  }

  function vistaPortafolio() {
    const posiciones = PROYECTOS.map((p) => ({ p, cant: misLadrillos(p.id) })).filter((x) => x.cant > 0);
    if (!posiciones.length) {
      return `<div class="contenedor seccion" style="padding-top:48px">
        <h1>Mi portafolio</h1>
        <div class="vacio"><p>Todavía no tienes ladrillos. Elige un proyecto y compra tu primer ladrillo desde ${usd.format(50)}.</p><a class="boton" href="#/proyectos">Ver proyectos</a></div>
      </div>`;
    }
    const invertido = posiciones.reduce((s, x) => s + x.cant * x.p.precioUsd, 0);
    const ladrillos = posiciones.reduce((s, x) => s + x.cant, 0);
    const ingreso = posiciones.reduce((s, x) => s + x.cant * x.p.precioUsd * x.p.rendimiento, 0);
    return `<div class="contenedor seccion" style="padding-top:48px">
      <div class="seccion-encabezado">
        <h1>Mi portafolio</h1>
        <button class="boton chico secundario" data-accion="vaciar">Vaciar compras de demo</button>
      </div>
      <dl class="resumen">
        <div><dt>Total invertido</dt><dd>${usd.format(invertido)}</dd></div>
        <div><dt>Ladrillos</dt><dd>${num.format(ladrillos)}</dd></div>
        <div><dt>Proyectos</dt><dd>${posiciones.length}</dd></div>
        <div><dt>Ingreso estimado al año</dt><dd>${usd2.format(ingreso)}</dd></div>
      </dl>
      <div class="posiciones">
        ${posiciones.map(({ p, cant }) => `
          <article class="posicion">
            <div>
              ${etiquetas(p)}
              <h3 style="margin-top:12px"><a href="#/proyecto/${p.id}">${esc(p.nombre)}</a></h3>
              <dl class="cifras">
                <div><dt>Ladrillos</dt><dd>${num.format(cant)}</dd></div>
                <div><dt>Invertido</dt><dd>${usd.format(cant * p.precioUsd)}</dd></div>
                <div><dt>Participación</dt><dd>${pct(cant / totalDe(p), 2)}</dd></div>
                <div><dt>Ingreso est./año</dt><dd>${usd2.format(cant * p.precioUsd * p.rendimiento)}</dd></div>
              </dl>
            </div>
            ${muro(totalDe(p), vendidosDe(p), cant, 40)}
          </article>`).join("")}
      </div>
      <p class="nota" style="color:var(--tenue);font-size:.85rem;margin-top:20px">Las compras hechas desde el sitio son simulaciones guardadas en este navegador. En la siguiente versión se firmarán con tu wallet de Stellar.</p>
    </div>`;
  }

  // ---------- Modal de compra ----------
  const modal = document.getElementById("modal");
  const modalContenido = document.getElementById("modal-contenido");
  let focoPrevio = null;

  function abrirModal(html) {
    focoPrevio = document.activeElement;
    modalContenido.innerHTML = html;
    modal.hidden = false;
    const primero = modal.querySelector("button, a");
    if (primero) primero.focus();
  }
  function cerrarModal() {
    modal.hidden = true;
    if (focoPrevio) focoPrevio.focus();
  }

  function confirmarCompra(p) {
    const cant = estado.cantidad[p.id];
    abrirModal(`
      <h2 id="modal-titulo">Confirma tu compra</h2>
      <p>Vas a comprar <strong>${num.format(cant)} ${cant === 1 ? "ladrillo" : "ladrillos"}</strong> de ${esc(p.nombre)}.</p>
      <dl class="resultado">
        <div><dt>Precio por ladrillo</dt><dd>${usd.format(p.precioUsd)}</dd></div>
        <div><dt>Tu participación</dt><dd>${pct(cant / totalDe(p), 2)}</dd></div>
        <div class="total"><dt>Total</dt><dd>${usd.format(cant * p.precioUsd)}</dd></div>
      </dl>
      <p class="nota" style="font-size:.85rem;color:var(--tenue)">Compra simulada para la demo. No se mueve dinero real.</p>
      <div class="acciones">
        <button class="boton secundario" data-cerrar>Cancelar</button>
        <button class="boton primario" data-accion="confirmar" data-id="${p.id}">Confirmar compra</button>
      </div>`);
  }

  function compraConfirmada(p, cant) {
    abrirModal(`
      <div class="check" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#18222E" stroke-width="3"><path d="M5 12l5 5 9-10"/></svg></div>
      <h2 id="modal-titulo">Compra confirmada</h2>
      <p>Ahora tienes <strong>${num.format(misLadrillos(p.id))} ${misLadrillos(p.id) === 1 ? "ladrillo" : "ladrillos"}</strong> de ${esc(p.nombre)}. Los verás marcados en amarillo en el muro del proyecto.</p>
      <div class="acciones">
        <button class="boton secundario" data-cerrar>Seguir viendo el proyecto</button>
        <a class="boton" href="#/portafolio" data-cerrar>Ver mi portafolio</a>
      </div>`);
  }

  // ---------- Rutas ----------
  function rutaActual() {
    const partes = (location.hash.replace(/^#\/?/, "") || "").split("/");
    return { nombre: partes[0] || "inicio", id: partes[1] };
  }

  function render() {
    const r = rutaActual();
    let html;
    if (r.nombre === "proyectos") html = vistaProyectos();
    else if (r.nombre === "proyecto") html = vistaProyecto(r.id);
    else if (r.nombre === "portafolio") html = vistaPortafolio();
    else html = vistaInicio();
    app.innerHTML = html;

    if (r.nombre === "proyecto" && proyecto(r.id)) actualizarSimulador(proyecto(r.id));

    document.querySelectorAll(".nav a").forEach((a) => {
      const activa = a.dataset.ruta === r.nombre || (a.dataset.ruta === "proyectos" && r.nombre === "proyecto");
      if (activa) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });

    const total = estado.compras.reduce((s, c) => s + c.cantidad, 0);
    const contador = document.getElementById("contador-portafolio");
    contador.hidden = total === 0;
    contador.textContent = num.format(total);
  }

  function navegar() {
    const r = rutaActual();
    render();
    if (r.nombre === "como-funciona") {
      const destino = document.getElementById("como-funciona");
      if (destino) destino.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
    const titulos = { inicio: "Invierte en bienes raíces ladrillo por ladrillo", proyectos: "Proyectos", portafolio: "Mi portafolio", "como-funciona": "Cómo funciona" };
    const p = r.nombre === "proyecto" && proyecto(r.id);
    document.title = `BrickChain · ${p ? p.nombre : titulos[r.nombre] || titulos.inicio}`;
  }

  // ---------- Eventos ----------
  function fijarCantidad(p, valor) {
    const max = disponiblesDe(p);
    const cant = Math.max(1, Math.min(Math.floor(Number(valor)) || 1, max));
    estado.cantidad[p.id] = cant;
    const input = document.getElementById("cantidad");
    const rango = document.getElementById("rango");
    if (input && Number(input.value) !== cant) input.value = cant;
    if (rango) rango.value = Math.min(cant, Number(rango.max));
    actualizarSimulador(p);
  }

  document.addEventListener("click", (e) => {
    const cerrar = e.target.closest("[data-cerrar]");
    if (cerrar) { cerrarModal(); if (cerrar.tagName !== "A") e.preventDefault(); return; }

    const boton = e.target.closest("[data-accion]");
    if (!boton) return;
    const r = rutaActual();
    const p = proyecto(boton.dataset.id || r.id);

    switch (boton.dataset.accion) {
      case "mas": if (p) fijarCantidad(p, estado.cantidad[p.id] + 1); break;
      case "menos": if (p) fijarCantidad(p, estado.cantidad[p.id] - 1); break;
      case "comprar": if (p) confirmarCompra(p); break;
      case "confirmar": {
        if (!p) break;
        const cant = Math.min(estado.cantidad[p.id], disponiblesDe(p));
        guardarCompras([...estado.compras, { id: p.id, cantidad: cant, fecha: new Date().toISOString() }]);
        render();
        compraConfirmada(p, cant);
        break;
      }
      case "actualizar": estado.vivo.cargando = false; cargarVivo(); render(); break;
      case "vaciar": guardarCompras([]); render(); break;
    }
  });

  document.addEventListener("input", (e) => {
    const p = proyecto(rutaActual().id);
    if (!p) return;
    if (e.target.id === "rango") fijarCantidad(p, e.target.value);
  });
  document.addEventListener("change", (e) => {
    const p = proyecto(rutaActual().id);
    if (p && e.target.id === "cantidad") fijarCantidad(p, e.target.value);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) cerrarModal();
  });

  window.addEventListener("hashchange", navegar);
  navegar();
  cargarVivo();
})();

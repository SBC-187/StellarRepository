// Proyectos de ejemplo. El primero se conecta a Stellar testnet si js/config.js tiene las llaves;
// en ese caso "vendidos" se reemplaza por el dato real de la red.
window.BRICKCHAIN_PROYECTOS = [
  {
    id: "torre-escazu",
    nombre: "Torre Demo Escazú",
    ubicacion: "Escazú, San José",
    tipo: "Residencial",
    descripcion: "Torre de 14 pisos con 84 apartamentos de una y dos habitaciones, a cinco minutos de la Ruta 27. Los ingresos vienen del alquiler de las unidades una vez terminada la obra.",
    total: 1000,
    vendidos: 236,
    precioUsd: 50,
    rendimiento: 0.08,
    plazoMeses: 36,
    pisos: 14,
    estado: "En construcción",
    enVivo: true
  },
  {
    id: "lofts-escalante",
    nombre: "Lofts Barrio Escalante",
    ubicacion: "Barrio Escalante, San José",
    tipo: "Uso mixto",
    descripcion: "Edificio de seis pisos con locales comerciales en planta baja y lofts en alquiler arriba, en la zona gastronómica de Escalante.",
    total: 800,
    vendidos: 512,
    precioUsd: 50,
    rendimiento: 0.075,
    plazoMeses: 30,
    pisos: 6,
    estado: "Preventa",
    enVivo: false
  },
  {
    id: "bodegas-coyol",
    nombre: "Bodegas El Coyol",
    ubicacion: "El Coyol, Alajuela",
    tipo: "Logístico",
    descripcion: "Complejo de bodegas para alquiler a empresas de logística y manufactura, cerca de la zona franca y del aeropuerto Juan Santamaría.",
    total: 1200,
    vendidos: 310,
    precioUsd: 50,
    rendimiento: 0.092,
    plazoMeses: 48,
    pisos: 2,
    estado: "Preventa",
    enVivo: false

  },
  {
    id: "condominio-tamarindo",
    nombre: "Condominio Playa Tamarindo",
    ubicacion: "Tamarindo, Guanacaste",
    tipo: "Turístico",
    descripcion: "Condominio de cuatro pisos con 32 unidades para alquiler vacacional, a 300 metros de la playa. Los ingresos vienen de las estancias de turistas durante todo el año.",
    total: 1500,
    vendidos: 120,
    precioUsd: 50,
    rendimiento: 0.095,
    plazoMeses: 42,
    pisos: 4,
    estado: "Preventa",
    enVivo: false
  }
];
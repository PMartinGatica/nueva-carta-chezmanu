// ============================================================
//  CHEZ MANU — Backend Google Apps Script
//  Web App que sirve los datos de la carta como JSON
//  Desplegado como: "Ejecutar como yo / Acceso: Cualquiera"
// ============================================================

// ── IDs de cada hoja (deben coincidir exactamente) ───────────
const SHEETS = {
  entrees:    'Entradas',
  mer:        'Principales_Mar',
  terre:      'Principales_Tierra',
  desserts:   'Postres',
  boissons:   'Bebidas',
  vinos:      'Vinos',
  historial:  'Historial_Precios',
};

// ── Columnas por hoja ────────────────────────────────────────
// Entradas / Principales / Postres:
//   A:ID  B:Nombre  C:Descripcion  D:Traduccion  E:Precio  F:Activo  G:Orden
//
// Vinos:
//   A:ID  B:Categoria  C:Varietal  D:Nombre  E:Precio  F:Activo  G:Orden
//
// Historial:
//   A:Fecha  B:Hoja  C:ID  D:Nombre  E:Precio_Anterior  F:Precio_Nuevo


// ============================================================
//  PUNTO DE ENTRADA — GET
//  El frontend llama a esta URL con ?action=menu (o sin nada)
// ============================================================
function doGet(e) {
  const action = e && e.parameter && e.parameter.action
    ? e.parameter.action
    : 'menu';

  let result;

  try {
    switch (action) {
      case 'menu':
        result = getFullMenu();
        break;
      case 'entrees':
        result = getItems(SHEETS.entrees);
        break;
      case 'mer':
        result = getItems(SHEETS.mer);
        break;
      case 'terre':
        result = getItems(SHEETS.terre);
        break;
      case 'desserts':
        result = getItems(SHEETS.desserts);
        break;
      case 'boissons':
        result = getItems(SHEETS.boissons);
        break;
      case 'vinos':
        result = getVinos();
        break;
      case 'setup':
        result = setupAndSeed();
        break;
      default:
        result = getFullMenu();
    }

    return buildResponse({ ok: true, data: result });

  } catch (err) {
    return buildResponse({ ok: false, error: err.message });
  }
}


// ============================================================
//  PUNTO DE ENTRADA — POST
//  Para operaciones desde el admin (futuro uso)
// ============================================================
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { action, sheet, data } = payload;

    switch (action) {
      case 'add':
        addItem(sheet, data);
        break;
      case 'update':
        updateItem(sheet, data);
        break;
      case 'toggle':
        toggleItem(sheet, data.id);
        break;
      default:
        throw new Error('Acción no reconocida: ' + action);
    }

    return buildResponse({ ok: true });

  } catch (err) {
    return buildResponse({ ok: false, error: err.message });
  }
}


// ============================================================
//  LECTURA — Menú completo de una vez
// ============================================================
function getFullMenu() {
  return {
    entrees:  getItems(SHEETS.entrees),
    mer:      getItems(SHEETS.mer),
    terre:    getItems(SHEETS.terre),
    desserts: getItems(SHEETS.desserts),
    boissons: getItems(SHEETS.boissons),
    vinos:    getVinos(),
  };
}


// ============================================================
//  LECTURA — Ítems de una hoja de menú
//  Devuelve solo los que tienen Activo = SI, ordenados por Orden
// ============================================================
function getItems(sheetName) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) throw new Error('Hoja no encontrada: ' + sheetName);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Solo tiene encabezado

  const headers = data[0];
  const rows    = data.slice(1);

  const items = rows
    .filter(row => row[0] !== '' && String(row[5]).toUpperCase() === 'SI')
    .map(row => ({
      id:          String(row[0]),
      nombre:      String(row[1]),
      descripcion: String(row[2] || ''),
      traduccion:  String(row[3] || ''),
      precio:      Number(row[4]) || 0,
      activo:      true,
      orden:       Number(row[6]) || 0,
    }))
    .sort((a, b) => a.orden - b.orden);

  return items;
}


// ============================================================
//  LECTURA — Vinos
//  Agrupa por categoria y varietal
// ============================================================
function getVinos() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.vinos);

  if (!sheet) throw new Error('Hoja no encontrada: ' + SHEETS.vinos);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return {};

  const rows = data.slice(1);

  // Filtrar activos y mapear
  const items = rows
    .filter(row => row[0] !== '' && String(row[5]).toUpperCase() === 'SI')
    .map(row => ({
      id:        String(row[0]),
      categoria: String(row[1]),
      varietal:  String(row[2] || ''),
      nombre:    String(row[3]),
      precio:    Number(row[4]) || 0,
      orden:     Number(row[6]) || 0,
    }))
    .sort((a, b) => a.orden - b.orden);

  // Agrupar por categoría → varietal → ítems
  const grouped = {};
  items.forEach(item => {
    const cat = item.categoria;
    if (!grouped[cat]) grouped[cat] = {};

    const vari = item.varietal || '__flat__';
    if (!grouped[cat][vari]) grouped[cat][vari] = [];

    grouped[cat][vari].push({
      id:      item.id,
      nombre:  item.nombre,
      precio:  item.precio,
    });
  });

  return grouped;
}


// ============================================================
//  ESCRITURA — Agregar ítem nuevo
// ============================================================
function addItem(sheetName, data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) throw new Error('Hoja no encontrada: ' + sheetName);

  const newId    = Utilities.getUuid();
  const lastRow  = sheet.getLastRow();
  const newOrder = lastRow; // orden = última fila (sin encabezado)

  if (sheetName === SHEETS.vinos) {
    sheet.appendRow([
      newId,
      data.categoria || '',
      data.varietal  || '',
      data.nombre,
      data.precio,
      'SI',
      newOrder,
    ]);
  } else {
    sheet.appendRow([
      newId,
      data.nombre,
      data.descripcion  || '',
      data.traduccion   || '',
      data.precio,
      'SI',
      newOrder,
    ]);
  }
}


// ============================================================
//  ESCRITURA — Actualizar ítem existente (busca por ID)
// ============================================================
function updateItem(sheetName, data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) throw new Error('Hoja no encontrada: ' + sheetName);

  const allData = sheet.getDataRange().getValues();
  const rowIdx  = allData.findIndex(row => String(row[0]) === String(data.id));

  if (rowIdx === -1) throw new Error('Ítem no encontrado: ' + data.id);

  const sheetRow = rowIdx + 1; // +1 porque getValues es base 0, Sheets es base 1

  if (sheetName === SHEETS.vinos) {
    if (data.categoria !== undefined) sheet.getRange(sheetRow, 2).setValue(data.categoria);
    if (data.varietal  !== undefined) sheet.getRange(sheetRow, 3).setValue(data.varietal);
    if (data.nombre    !== undefined) sheet.getRange(sheetRow, 4).setValue(data.nombre);
    if (data.precio    !== undefined) sheet.getRange(sheetRow, 5).setValue(data.precio);
  } else {
    if (data.nombre      !== undefined) sheet.getRange(sheetRow, 2).setValue(data.nombre);
    if (data.descripcion !== undefined) sheet.getRange(sheetRow, 3).setValue(data.descripcion);
    if (data.traduccion  !== undefined) sheet.getRange(sheetRow, 4).setValue(data.traduccion);
    if (data.precio      !== undefined) sheet.getRange(sheetRow, 5).setValue(data.precio);
  }
}


// ============================================================
//  ESCRITURA — Activar / Desactivar ítem (columna F = Activo)
// ============================================================
function toggleItem(sheetName, itemId) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  const allData = sheet.getDataRange().getValues();
  const rowIdx  = allData.findIndex(row => String(row[0]) === String(itemId));

  if (rowIdx === -1) throw new Error('Ítem no encontrado: ' + itemId);

  const sheetRow    = rowIdx + 1;
  const actualValue = String(allData[rowIdx][5]).toUpperCase();
  const newValue    = actualValue === 'SI' ? 'NO' : 'SI';

  sheet.getRange(sheetRow, 6).setValue(newValue);
}


// ============================================================
//  TRIGGER — Historial de precios (onEdit automático)
//  Se ejecuta cada vez que alguien edita una celda en Sheets
//  Instalar: Extensiones → Apps Script → Triggers → onEdit
// ============================================================
function onEdit(e) {
  const range   = e.range;
  const sheet   = range.getSheet();
  const col     = range.getColumn();
  const row     = range.getRow();
  const nombre  = sheet.getName();

  // Solo registrar si es la columna E (Precio = col 5) en hojas de menú/vinos
  const sheetsConPrecio = Object.values(SHEETS).filter(s => s !== SHEETS.historial);
  if (!sheetsConPrecio.includes(nombre)) return;
  if (col !== 5) return;   // col 5 = Precio
  if (row <= 1)  return;   // fila 1 = encabezado

  const precioNuevo   = e.value;
  const precioAnterior = e.oldValue;

  // Ignorar si no hay cambio real o si es la primera vez que se carga
  if (!precioAnterior || precioAnterior === precioNuevo) return;

  const id     = sheet.getRange(row, 1).getValue();
  const nombre_item = sheet.getRange(row, nombre === SHEETS.vinos ? 4 : 2).getValue();

  const ss           = SpreadsheetApp.getActiveSpreadsheet();
  const histSheet    = ss.getSheetByName(SHEETS.historial);

  histSheet.appendRow([
    new Date(),
    nombre,
    id,
    nombre_item,
    Number(precioAnterior) || 0,
    Number(precioNuevo)    || 0,
  ]);
}


// ============================================================
//  SETUP — Crear todas las hojas con su estructura
//  Correr UNA sola vez desde el editor de Apps Script
// ============================================================
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const config = [
    {
      name: SHEETS.entrees,
      headers: ['ID', 'Nombre', 'Descripcion', 'Traduccion', 'Precio', 'Activo', 'Orden'],
      color: '#C00000',
    },
    {
      name: SHEETS.mer,
      headers: ['ID', 'Nombre', 'Descripcion', 'Traduccion', 'Precio', 'Activo', 'Orden'],
      color: '#548DD4',
    },
    {
      name: SHEETS.terre,
      headers: ['ID', 'Nombre', 'Descripcion', 'Traduccion', 'Precio', 'Activo', 'Orden'],
      color: '#984806',
    },
    {
      name: SHEETS.desserts,
      headers: ['ID', 'Nombre', 'Descripcion', 'Traduccion', 'Precio', 'Activo', 'Orden'],
      color: '#C00000',
    },
    {
      name: SHEETS.boissons,
      headers: ['ID', 'Nombre', 'Descripcion', 'Traduccion', 'Precio', 'Activo', 'Orden'],
      color: '#2E86C1',
    },
    {
      name: SHEETS.vinos,
      headers: ['ID', 'Categoria', 'Varietal', 'Nombre', 'Precio', 'Activo', 'Orden'],
      color: '#6B1A45',
    },
    {
      name: SHEETS.historial,
      headers: ['Fecha', 'Hoja', 'ID', 'Nombre', 'Precio_Anterior', 'Precio_Nuevo'],
      color: '#1A1410',
    },
  ];

  config.forEach(({ name, headers, color }) => {
    let sheet = ss.getSheetByName(name);

    // Crear si no existe
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }

    // Encabezados en fila 1
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground(color);
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(11);

    // Congelar fila de encabezados
    sheet.setFrozenRows(1);

    // Ancho automático de columnas
    sheet.autoResizeColumns(1, headers.length);

    // Validación de datos para columna Activo (F = col 6)
    if (name !== SHEETS.historial) {
      const activoRange = sheet.getRange(2, 6, 1000, 1);
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['SI', 'NO'], true)
        .setAllowInvalid(false)
        .build();
      activoRange.setDataValidation(rule);
    }

    // Proteger encabezados para que no se borren accidentalmente
    const protection = headerRange.protect();
    protection.setDescription('Encabezados — no modificar');
    protection.setWarningOnly(true);
  });

  // Hoja de Historial: columna Fecha con formato legible
  const histSheet = ss.getSheetByName(SHEETS.historial);
  histSheet.getRange('A2:A1000').setNumberFormat('dd/mm/yyyy HH:mm');

  // Formato de moneda en columnas Precio de todas las hojas de menú
  [SHEETS.entrees, SHEETS.mer, SHEETS.terre, SHEETS.desserts, SHEETS.boissons].forEach(name => {
    const s = ss.getSheetByName(name);
    s.getRange('E2:E1000').setNumberFormat('$#,##0');
  });
  const vinosSheet = ss.getSheetByName(SHEETS.vinos);
  vinosSheet.getRange('E2:E1000').setNumberFormat('$#,##0');
  const histSheet2 = ss.getSheetByName(SHEETS.historial);
  histSheet2.getRange('E2:F1000').setNumberFormat('$#,##0');

  // Solo mostrar alert si se ejecuta desde la UI (no desde doGet)
  try {
    SpreadsheetApp.getUi().alert('✅ Hojas creadas correctamente. Ahora corré seedData() para cargar los datos iniciales.');
  } catch (e) {
    // Se ejecutó desde doGet, no hay UI disponible — está ok
  }
}


// ============================================================
//  SEED — Cargar datos iniciales de la carta
//  Correr UNA sola vez después de setupSheets()
// ============================================================
function seedData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── ENTRADAS ─────────────────────────────────────────────
  const entreeData = [
    [genId(), 'Cojinova ahumada con pickles de salicornia',                     '',                              'Smoked wreckfish with salicornia pickles',                    32000, 'SI', 1],
    [genId(), 'Centolla con Vieiras marinadas en agua de mar',                  '',                              'King Crab with gently seawater-marinated scallops',           45000, 'SI', 2],
    [genId(), 'Carpaccio de peceto de cordero, hojas verdes y queso de oveja',  '',                              "Lamb Carpaccio with green leaves and sheep's cheese",         28500, 'SI', 3],
    [genId(), 'Terrina de cerdo "de ma grand-mère", jamón crudo y quesos',      '',                              "Grandmother's pork terrine with cured ham and cheeses",       39000, 'SI', 4],
  ];
  appendRows(ss, SHEETS.entrees, entreeData);

  // ── PRINCIPALES — LA MER ──────────────────────────────────
  const merData = [
    [genId(), 'Merluza negra cocida en agua de mar',   '', 'Patagonian toothfish gently cooked in seawater', 61500, 'SI', 1],
    [genId(), 'Vieiras gratinadas del Atlántico Sur',  '', 'South Atlantic Scallops au gratin',               40200, 'SI', 2],
    [genId(), 'Risotto de hongos patagónicos',         '', 'Patagonian wild mushroom risotto',                38000, 'SI', 3],
  ];
  appendRows(ss, SHEETS.mer, merData);

  // ── PRINCIPALES — LA TERRE ────────────────────────────────
  const terreData = [
    [genId(), 'Dúo de cordero "Chez Manu"',          '', 'Lamb duo "Chez Manu" style',          42500, 'SI', 1],
    [genId(), 'Ojo de bife con hongos patagónicos',   '', 'Ribeye steak with Patagonian mushrooms', 46000, 'SI', 2],
    [genId(), 'Solomillo de cerdo con mostaza Dijon', '', 'Pork tenderloin with Dijon mustard',   40000, 'SI', 3],
  ];
  appendRows(ss, SHEETS.terre, terreData);

  // ── POSTRES ───────────────────────────────────────────────
  const dessertData = [
    [genId(), 'Crème brûlée "tradition"',                                      '(crema aromatizada de vainilla)',    '',                                                                        11500, 'SI', 1],
    [genId(), 'Tarte Tatin de manzana y helado de vainilla',                    '',                                  '',                                                                        14000, 'SI', 2],
    [genId(), 'Pera épicée en infusión de calafate, helado de mascarpone',      '',                                  'Spiced pear in calafate infusion',                                        13800, 'SI', 3],
    [genId(), 'Fuego sobre el glaciar',                                         '(helado recubierto en merengue, flambée)', '"Fire over the Glacier" — Ice cream coated in meringue, flambéed', 10500, 'SI', 4],
    [genId(), 'Tarta de chocolate caliente y helado',                           '',                                  'Hot chocolate cake and ice cream',                                        15600, 'SI', 5],
    [genId(), 'Copa de Helado artesanal',                                       '',                                  '',                                                                         9000, 'SI', 6],
  ];
  appendRows(ss, SHEETS.desserts, dessertData);

  // ── BEBIDAS SIN ALCOHOL ──────────────────────────────────
  const boissonsData = [
    [genId(), 'Agua mineral',              '', 'Mineral water',              5000, 'SI', 1],
    [genId(), 'Agua saborizada',           '', 'Flavored water',             6000, 'SI', 2],
    [genId(), 'Café espresso',             '', 'Espresso coffee',            4500, 'SI', 3],
    [genId(), 'Café doble',                '', 'Double espresso',            5500, 'SI', 4],
    [genId(), 'Café con leche',            '', 'Coffee with milk',           5500, 'SI', 5],
    [genId(), 'Chocolat chaud',            '', 'Hot chocolate',              6500, 'SI', 6],
    [genId(), 'Jugo de naranja exprimido', '', 'Fresh squeezed orange juice', 7000, 'SI', 7],
    [genId(), 'Gaseosa línea Coca-Cola',   '', 'Coca-Cola soft drinks',      5500, 'SI', 8],
  ];
  appendRows(ss, SHEETS.boissons, boissonsData);

  // ── VINOS ─────────────────────────────────────────────────
  // Columnas: ID | Categoria | Varietal | Nombre | Precio | Activo | Orden
  const vinosData = [
    // Espumante Argentino
    [genId(), 'espum-arg', '',              'La Posta Nature',                   40000, 'SI',  1],
    [genId(), 'espum-arg', '',              'Cruzat Cosecha Temprana',           48020, 'SI',  2],
    // Espumante Francés
    [genId(), 'espum-fr',  'Espumante',    'Le Bulle — Chateau La Coste',       85000, 'SI',  1],
    [genId(), 'espum-fr',  'Champagne',    'Veuve Clicquot Brut Yellow Label', 350000, 'SI',  2],
    [genId(), 'espum-fr',  'Champagne',    'Moët & Chandon Impérial Brut',     330000, 'SI',  3],
    // Blancos — Chardonnay
    [genId(), 'blancos',   'Chardonnay',   'Lagarde Chardonnay',                26000, 'SI',  1],
    [genId(), 'blancos',   'Chardonnay',   'Primogénito Chardonnay',            29000, 'SI',  2],
    [genId(), 'blancos',   'Chardonnay',   'Escorihuela Gascón Gran Reserva',   40000, 'SI',  3],
    [genId(), 'blancos',   'Chardonnay',   'Luca Chardonnay',                   48000, 'SI',  4],
    [genId(), 'blancos',   'Chardonnay',   'Angélica Zapata Chardonnay',        56000, 'SI',  5],
    [genId(), 'blancos',   'Chardonnay',   'Contra Corriente Chardonnay',       60000, 'SI',  6],
    [genId(), 'blancos',   'Chardonnay',   'Barda Chardonnay',                  84000, 'SI',  7],
    // Blancos — Sauvignon Blanc
    [genId(), 'blancos',   'Sauvignon Blanc', 'Trumpeter Sauvignon Blanc',      18000, 'SI',  8],
    [genId(), 'blancos',   'Sauvignon Blanc', 'Wapisa Sauvignon Blanc',         22000, 'SI',  9],
    [genId(), 'blancos',   'Sauvignon Blanc', 'Rutini Sauvignon Blanc',         35000, 'SI', 10],
    [genId(), 'blancos',   'Sauvignon Blanc', 'Luigi Bosca Sauvignon Blanc',    45000, 'SI', 11],
    [genId(), 'blancos',   'Sauvignon Blanc', 'Pequeñas Producciones Sauvignon Blanc', 62000, 'SI', 12],
    // Blancos — Torrontés
    [genId(), 'blancos',   'Torrontés y Naranjos', 'Altaland Torrontés',        23000, 'SI', 13],
    [genId(), 'blancos',   'Torrontés y Naranjos', 'Amalaya Blanco Bajo Alcohol', 27000, 'SI', 14],
    // Blancos — Dulces
    [genId(), 'blancos',   'Dulces y Tardíos', 'Susana Balbo Late Harvest Malbec', 40880, 'SI', 15],
    [genId(), 'blancos',   'Dulces y Tardíos', 'Mendel Petite Manseng',         53200, 'SI', 16],
    // Blancos — Rosado
    [genId(), 'blancos',   'Rosado',        'Trumpeter Rosé',                   18860, 'SI', 17],
    // Tintos Ligeros
    [genId(), 'ligeros',   '',              'La Posta Glorieta Pinot Noir',      21800, 'SI',  1],
    [genId(), 'ligeros',   '',              'Wapisa Pinot Noir',                 23500, 'SI',  2],
    [genId(), 'ligeros',   '',              'Primogénito Sangre Azul',           39500, 'SI',  3],
    [genId(), 'ligeros',   '',              'Rutini Pinot Noir',                 48500, 'SI',  4],
    [genId(), 'ligeros',   '',              'Araucana Pinot Noir',               53500, 'SI',  5],
    [genId(), 'ligeros',   '',              'Barda Pinot Noir',                  80000, 'SI',  6],
    [genId(), 'ligeros',   '',              'Rutini Merlot',                     28500, 'SI',  7],
    // Tintos Cuerpo Medio
    [genId(), 'medio',     '',              'Trumpeter Cabernet Sauvignon',      20500, 'SI',  1],
    [genId(), 'medio',     '',              'Aruma Malbec',                      35500, 'SI',  2],
    [genId(), 'medio',     '',              'Carmelo Patti Cabernet Sauvignon',  42500, 'SI',  3],
    [genId(), 'medio',     '',              'Rutini Malbec',                     45000, 'SI',  4],
    [genId(), 'medio',     '',              'Luca Malbec',                       48000, 'SI',  5],
    [genId(), 'medio',     '',              'Angélica Zapata Alta Malbec',       59500, 'SI',  6],
    [genId(), 'medio',     '',              'Clos de los 7',                     29000, 'SI',  7],
    [genId(), 'medio',     '',              'Cuvelier Colección Blend',          36500, 'SI',  8],
    [genId(), 'medio',     '',              'Cuvelier Los Andes',                59900, 'SI',  9],
    // Tintos Potentes
    [genId(), 'potentes',  '',              'Escorihuela Gascón Syrah',          23000, 'SI',  1],
    [genId(), 'potentes',  '',              'San Pedro de Yacochuya Malbec',     50500, 'SI',  2],
    [genId(), 'potentes',  '',              'El Gran Enemigo Cabernet Franc',    74900, 'SI',  3],
    [genId(), 'potentes',  '',              'Luca Beso de Dante',                74500, 'SI',  4],
    [genId(), 'potentes',  '',              'MEG Escorihuela Gascón',            62500, 'SI',  5],
    [genId(), 'potentes',  '',              'Escorihuela Gascón Gran Reserva',   82500, 'SI',  6],
  ];
  appendRows(ss, SHEETS.vinos, vinosData);

  try {
    SpreadsheetApp.getUi().alert('✅ Datos cargados correctamente en todas las hojas.');
  } catch (e) {
    // Se ejecutó desde doGet, no hay UI disponible — está ok
  }
}


// ============================================================
//  SETUP + SEED EN UN SOLO PASO (invocable desde ?action=setup)
//  Crea las hojas Y carga los datos iniciales de una vez
// ============================================================
function setupAndSeed() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Verificar si ya hay datos (evitar duplicación)
  const testSheet = ss.getSheetByName(SHEETS.entrees);
  if (testSheet && testSheet.getLastRow() > 1) {
    return { message: '⚠️ Las hojas ya tienen datos. No se re-ejecutó el seed para evitar duplicados.' };
  }

  setupSheets();
  seedData();

  return { message: '✅ Hojas creadas y datos cargados correctamente.' };
}


// ============================================================
//  UTILIDADES INTERNAS
// ============================================================
function genId() {
  return Utilities.getUuid().substring(0, 8).toUpperCase();
}

function appendRows(ss, sheetName, rows) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Hoja no encontrada: ' + sheetName);
  rows.forEach(row => sheet.appendRow(row));
}

function buildResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ============================================================
//  MENÚ PERSONALIZADO EN GOOGLE SHEETS
//  Aparece como "🍽️ Chez Manu" en la barra de menú del Sheet
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🍽️ Chez Manu')
    .addItem('1. Crear hojas (primera vez)', 'setupSheets')
    .addItem('2. Cargar datos iniciales', 'seedData')
    .addSeparator()
    .addItem('Ver URL de la API', 'showApiUrl')
    .addItem('Probar API en navegador', 'openApiUrl')
    .addToUi();
}

function showApiUrl() {
  const url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert(
    '🔗 URL de la API:\n\n' + url +
    '\n\nCopiá esta URL y pegala en el index.html donde dice API_URL.'
  );
}

function openApiUrl() {
  const url = ScriptApp.getService().getUrl() + '?action=menu';
  const html = HtmlService.createHtmlOutput(
    `<script>window.open('${url}'); google.script.host.close();</script>`
  );
  SpreadsheetApp.getUi().showModalDialog(html, 'Abriendo API...');
}

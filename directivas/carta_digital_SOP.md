# Carta Digital Chez Manu — SOP (Standard Operating Procedure)

## Objetivo
Conectar el frontend HTML de la carta digital con el backend en Google Apps Script, 
para que los datos del menú se carguen en vivo desde Google Sheets.

## Contexto
- **Frontend:** `index.html` — HTML estático con CSS y JS inline
- **Backend:** Google Apps Script (`Code.gs`) desplegado como Web App
- **Base de datos:** Google Sheets (6 hojas: Entradas, Principales_Mar, Principales_Tierra, Postres, Vinos, Historial_Precios)
- **Schema:** Documentado en `schema-setup.md`

## Flujo de Ejecución

### Setup inicial (una sola vez)
1. Abrir el Google Spreadsheet en Google Sheets
2. Ir a **Extensiones → Apps Script**
3. Pegar el contenido de `Code.gs` completo
4. Guardar el proyecto como "Chez Manu Backend"
5. **Ejecutar `setupAndSeed()`** desde el editor de Apps Script (o llamar `?action=setup` desde la URL)
   - Esto crea las 6 hojas con headers, formatos, validaciones
   - Y carga los datos iniciales del menú
   - Tiene protección contra ejecución duplicada
6. **Implementar como Web App:**
   - Clic en "Implementar" → "Nueva implementación"
   - Tipo: Web App
   - Ejecutar como: Yo
   - Acceso: Cualquiera
7. Copiar la URL generada → es la `API_URL`
8. Activar trigger `onEdit` para el historial de precios

### Flujo de datos en producción
```
Cliente abre index.html
    ↓
JS hace fetch a API_URL?action=menu
    ↓
Apps Script lee las 6 hojas del Spreadsheet
    ↓
Devuelve JSON con: { ok: true, data: { entrees, mer, terre, desserts, vinos } }
    ↓
JS renderiza los datos en el DOM
    ↓
El dueño edita precios directamente en Google Sheets
    ↓
Los cambios se reflejan al próximo refresh
```

## Interfaces

### API → Frontend
**Endpoint:** `GET {API_URL}?action=menu`

**Response:**
```json
{
  "ok": true,
  "data": {
    "entrees": [{ "id": "...", "nombre": "...", "descripcion": "", "traduccion": "", "precio": 32000, "activo": true, "orden": 1 }],
    "mer": [...],
    "terre": [...],
    "desserts": [...],
    "vinos": {
      "espum-arg": { "__flat__": [{ "id": "...", "nombre": "...", "precio": 40000 }] },
      "blancos": { "Chardonnay": [...], "Sauvignon Blanc": [...], "__flat__": [] }
    }
  }
}
```

### Campos por tipo
- **Platos:** id, nombre, descripcion, traduccion, precio, activo, orden
- **Vinos:** id, categoria, varietal, nombre, precio, orden (agrupados por categoría → varietal)

## Variables de Entorno (.env)
```
NEXT_PUBLIC_API_URL=https://script.google.com/macros/s/[DEPLOY_ID]/exec
GOOGLE_SPREADSHEET_ID=1811XXBxsBNcDEyEBXOiyc_t1voZ3bjNbmi59yX5uvD4
```

## Restricciones y Casos Borde
⚠️ `SpreadsheetApp.getUi()` lanza error cuando se llama desde `doGet()` (no hay UI disponible). Wrappear con try/catch.
⚠️ El frontend usa las propiedades en español (`nombre`, `precio`, `descripcion`, `traduccion`) que vienen del backend.
⚠️ Los vinos vienen agrupados como objeto anidado: `{ categoria: { varietal: [items] } }`. Los ítems sin varietal usan la key `__flat__`.
⚠️ `setupAndSeed()` verifica si ya hay datos para evitar duplicación.
⚠️ Google Apps Script tiene un límite de 6 minutos por ejecución — el seed con ~50 filas no debería tener problemas.

## Dependencias
- **Servicios:** Google Sheets, Google Apps Script
- **Librerías frontend:** jsPDF, html2canvas (para PDF)
- **Fonts:** Cormorant Garamond, Playfair Display, Cinzel (Google Fonts)

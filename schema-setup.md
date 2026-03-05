# Chez Manu — Google Sheets Schema & Guía de Setup

## Estructura del Google Sheet

El spreadsheet tiene **6 hojas** (pestañas). No renombrarlas — el código las busca por nombre exacto.

---

## Hoja 1 — `Entradas`

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| **ID** | **Nombre** | **Descripcion** | **Traduccion** | **Precio** | **Activo** | **Orden** |
| A1B2C3D4 | Cojinova ahumada con pickles de salicornia | | Smoked wreckfish with salicornia pickles | 32000 | SI | 1 |
| E5F6G7H8 | Centolla con Vieiras marinadas en agua de mar | | King Crab with gently seawater-marinated scallops | 45000 | SI | 2 |

**Reglas:**
- `Activo` solo acepta `SI` o `NO` (validación de lista automática)
- `Precio` en pesos enteros, sin puntos ni comas (el formato lo pone la hoja)
- `Orden` define el orden de aparición en la carta (1 = primero)
- Para ocultar un plato temporalmente: cambiar `Activo` a `NO`

---

## Hoja 2 — `Principales_Mar`

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| **ID** | **Nombre** | **Descripcion** | **Traduccion** | **Precio** | **Activo** | **Orden** |
| ... | Merluza negra cocida en agua de mar | | Patagonian toothfish gently cooked in seawater | 61500 | SI | 1 |
| ... | Vieiras gratinadas del Atlántico Sur | | South Atlantic Scallops au gratin | 40200 | SI | 2 |

Igual estructura que Entradas.

---

## Hoja 3 — `Principales_Tierra`

Misma estructura que `Principales_Mar`.

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| **ID** | **Nombre** | **Descripcion** | **Traduccion** | **Precio** | **Activo** | **Orden** |
| ... | Dúo de cordero "Chez Manu" | | Lamb duo "Chez Manu" style | 42500 | SI | 1 |

---

## Hoja 4 — `Postres`

Misma estructura. La columna `Descripcion` se usa para aclaraciones (ej: *crema aromatizada de vainilla*).

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| **ID** | **Nombre** | **Descripcion** | **Traduccion** | **Precio** | **Activo** | **Orden** |
| ... | Crème brûlée "tradition" | (crema aromatizada de vainilla) | | 11500 | SI | 1 |

---

## Hoja 5 — `Vinos`

Tiene una columna extra: `Categoria` y `Varietal`.

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| **ID** | **Categoria** | **Varietal** | **Nombre** | **Precio** | **Activo** | **Orden** |
| ... | espum-arg | | La Posta Nature | 40000 | SI | 1 |
| ... | espum-fr | Champagne | Veuve Clicquot Brut Yellow Label | 350000 | SI | 2 |
| ... | blancos | Chardonnay | Lagarde Chardonnay | 26000 | SI | 1 |
| ... | blancos | Sauvignon Blanc | Trumpeter Sauvignon Blanc | 18000 | SI | 8 |
| ... | ligeros | | La Posta Glorieta Pinot Noir | 21800 | SI | 1 |
| ... | medio | | Aruma Malbec | 35500 | SI | 2 |
| ... | potentes | | El Gran Enemigo Cabernet Franc | 74900 | SI | 3 |

**Valores válidos para `Categoria`:**

| Categoria | Qué es |
|---|---|
| `espum-arg` | Espumante Argentino |
| `espum-fr` | Espumante Francés / Champagne |
| `blancos` | Vinos Blancos (todos los varietales) |
| `ligeros` | Tintos Ligeros & Frutados |
| `medio` | Tintos de Cuerpo Medio |
| `potentes` | Tintos Potentes & Estructurados |

**Varietal:** Solo se usa en `blancos` y `espum-fr`. Para todos los tintos se deja vacío. El frontend agrupa automáticamente los blancos por varietal.

---

## Hoja 6 — `Historial_Precios`

**Esta hoja se llena sola.** Cada vez que alguien cambia un precio en cualquier otra hoja, se registra aquí automáticamente.

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| **Fecha** | **Hoja** | **ID** | **Nombre** | **Precio_Anterior** | **Precio_Nuevo** |
| 12/01/2025 14:32 | Entradas | A1B2C3D4 | Cojinova ahumada... | $28.000 | $32.000 |

No editar esta hoja manualmente.

---

## Instrucciones de instalación (una sola vez)

### Paso 1 — Crear el Google Sheet

1. Ir a [sheets.google.com](https://sheets.google.com)
2. Crear un spreadsheet nuevo → nombrarlo **"Chez Manu — Carta Digital"**
3. Guardarlo en Google Drive en una carpeta accesible

### Paso 2 — Pegar el código

1. En el Sheet, ir al menú **Extensiones → Apps Script**
2. Borrar todo el código que aparece por defecto
3. Pegar el contenido completo de `Code.gs`
4. Hacer clic en el ícono 💾 (Guardar) → nombrarlo **"Chez Manu Backend"**

### Paso 3 — Crear las hojas

1. Volver al Google Sheet (no cerrar Apps Script)
2. Recargar la página → aparecerá el menú **🍽️ Chez Manu** en la barra
3. Hacer clic en **🍽️ Chez Manu → 1. Crear hojas (primera vez)**
4. Aceptar los permisos que pide Google
5. Esperar el mensaje de confirmación ✅

### Paso 4 — Cargar los datos iniciales

1. Hacer clic en **🍽️ Chez Manu → 2. Cargar datos iniciales**
2. Esperar el mensaje ✅
3. Verificar que las hojas tienen datos en todas las filas

### Paso 5 — Activar el trigger de historial

1. Ir a **Extensiones → Apps Script**
2. En el panel izquierdo, hacer clic en el ícono ⏰ **(Triggers)**
3. Clic en **"+ Agregar trigger"** (abajo a la derecha)
4. Configurar así:
   - Función a ejecutar: `onEdit`
   - Fuente del evento: `Del spreadsheet`
   - Tipo de evento: `Al editar`
5. Guardar

### Paso 6 — Publicar como Web App

1. En Apps Script, clic en **"Implementar" → "Nueva implementación"**
2. Tipo: **Web App**
3. Descripción: `v1`
4. Ejecutar como: **Yo (tu email)**
5. Quién tiene acceso: **Cualquiera**
6. Clic en **"Implementar"**
7. Copiar la URL que aparece (empieza con `https://script.google.com/macros/s/...`)

### Paso 7 — Conectar con el frontend

1. En el `index.html`, buscar la línea:
   ```js
   const API_URL = 'TU_URL_AQUI';
   ```
2. Reemplazar `TU_URL_AQUI` con la URL copiada en el paso anterior
3. La URL también se puede ver en cualquier momento desde **🍽️ Chez Manu → Ver URL de la API**

---

## Guía de uso diario para el dueño

### ✅ Cambiar un precio
1. Abrir el Google Sheet
2. Ir a la hoja correspondiente (ej: `Vinos`)
3. Buscar el vino en la columna D (Nombre)
4. Hacer clic en la celda de la columna E (Precio)
5. Escribir el nuevo precio (solo números, sin $ ni puntos)
6. Presionar Enter
7. **Listo** — el cambio aparece en la carta digital automáticamente

### ✅ Ocultar un plato temporalmente (ej: no hay stock)
1. Ir a la hoja correspondiente
2. Buscar el ítem
3. En la columna F (Activo), cambiar `SI` por `NO`
4. El plato desaparece de la carta pero no se pierde

### ✅ Agregar un plato nuevo
1. Ir a la última fila de la hoja correspondiente
2. En la columna A (ID), escribir cualquier código corto (ej: `NV001`)
3. Completar las demás columnas
4. En Activo poner `SI`
5. En Orden poner el número de posición que querés

### ❌ Lo que NO hay que hacer
- No cambiar los nombres de las pestañas (hojas)
- No borrar la fila 1 (encabezados en color)
- No tocar la hoja `Historial_Precios`
- No dejar la columna Precio vacía o con letras

---

## Diagrama de flujo

```
Dueño edita precio en Google Sheet
         ↓
Trigger onEdit registra el cambio en Historial_Precios
         ↓
Cliente abre la carta en el celular o computadora
         ↓
El HTML hace fetch a la URL de Apps Script
         ↓
Apps Script lee Google Sheet y devuelve JSON
         ↓
La carta muestra los precios actualizados
```

**Tiempo de actualización:** instantáneo. En cuanto el dueño guarda el cambio en el Sheet, la carta ya refleja el nuevo precio.

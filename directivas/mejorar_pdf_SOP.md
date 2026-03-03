# SOP: Optimización de Nitidez de Fuente y Exportación PDF

## Objetivo
Mejorar la calidad visual de la tipografía en la aplicación web y asegurar que la descarga de PDF sea de alta resolución, con texto nítido y fondo blanco puro (sin tonalidades crema o sombras).

## Entradas
- Archivo `index.html` con bibliotecas `jspdf` y `html2canvas`.

## Lógica de Mejora

### 1. Nitidez de Fuente (CSS)
- Aplicar `-webkit-font-smoothing: antialiased` y `-moz-osx-font-smoothing: grayscale` para suavizar bordes.
- Usar `text-rendering: optimizeLegibility` para mejorar el kerning y renderizado.
- Asegurar pesos de fuente explícitos para evitar renderizado borroso por "faux-bold".

### 2. Exportación PDF (JavaScript/html2canvas)
- **Escalado**: Incrementar el factor de escala de `html2canvas` de 3 a 4 para aumentar la densidad de píxeles sin sobrecargar el navegador.
- **Opción Letter-Rendering**: Asegurar que `useCORS` y `allowTaint` estén activos si se usan recursos externos.
- **Fondo**: Forzar `backgroundColor: "#ffffff"` en las opciones de `html2canvas`.
- **Filtros CSS Preliminares**: Antes de capturar, se debe asegurar que no haya sombras (`text-shadow`, `box-shadow`) que degraden el rasterizado si el usuario busca nitidez máxima (opcional según diseño).

### 3. Ajustes de Impresión
- Configurar `@media print` para eliminar cualquier color de fondo y forzar contraste máximo (negro sobre blanco).

## Trampas Conocidas / Restricciones
- **Rasterización**: `html2canvas` siempre convierte el contenido en una imagen. Si se requiere nitidez de vector, se debería usar `window.print()` nativo, pero para un botón de descarga específico, el escalado alto es la mejor solución intermedia.
- **Recorte de Imágenes**: Al segmentar páginas en PDF, asegurarse de que el contexto de dibujo (`2d`) limpie el canvas previo para evitar "fantasmas" de secciones anteriores.
- **Fuentes Externas**: Si las fuentes de Google Fonts no cargan a tiempo, la captura usará fuentes del sistema. Se debe asegurar la carga completa (`document.fonts.ready`).

## Pasos de Verificación
1. Abrir la página y verificar nitidez en pantalla.
2. Descargar el PDF de cada sección.
3. Hacer zoom al 300% en el PDF; el texto debe permanecer legible y definido.
4. Confirmar que el fondo sea blanco RGB(255,255,255).

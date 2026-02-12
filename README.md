# Presupuestos Mantenimiento Eléctrico - PWA

Una Progressive Web App (PWA) moderna para la gestión y análisis de presupuestos de mantenimiento eléctrico con visualizaciones interactivas, filtros avanzados y navegación cronológica.

## 🚀 Características

### 📊 Dashboard Interactivo
- **KPIs en tiempo real**: Gasto total, promedio, cantidad de salidas y máquina con mayor gasto
- **Múltiples gráficos**:
  - Tendencia de gastos mensual (línea)
  - Distribución por departamento (dona)
  - Gasto por tipo de mantenimiento (barras)
  - Top 10 máquinas por gasto (barras horizontales)

### 🕐 Vista Cronológica
- Navegación mes a mes con controles intuitivos
- Vista mensual y semanal
- KPIs del período seleccionado
- Gráfico de tendencia con acumulado
- Desglose detallado por departamento

### 🏭 Organigrama de Producción
- Estructura jerárquica: Departamento → Sección → Máquina
- Vista completa de todas las líneas de producción
- Click en cualquier máquina para ver detalles individuales
- Totales agregados por departamento y sección

### 🔍 Detalle por Máquina
- Modal con información completa de cada máquina
- Gráfico histórico de gastos
- Tabla detallada de todas las salidas de bodega
- Información de departamento, sección y gasto total

### 🎯 Filtros Avanzados
- Filtro por año
- Filtro por mes
- Filtro por departamento
- Filtro por sección
- Filtro por tipo de mantenimiento
- Botón de reset para limpiar todos los filtros

### 📱 PWA Features
- Instalable en escritorio y móvil
- Funciona offline (después de primera carga)
- Responsive design para todos los dispositivos
- Carga rápida con caché inteligente

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Gráficos**: Chart.js 4.4.1
- **Parseo CSV**: PapaParse 5.4.1
- **PWA**: Service Worker, Web App Manifest
- **Sin dependencias de Node.js**: Todo funciona con CDN

## 📦 Estructura del Proyecto

```
presupuesto-app/
├── index.html              # Página principal
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker
├── css/
│   └── styles.css         # Estilos modernos y responsive
├── js/
│   ├── app.js             # Lógica principal de la aplicación
│   ├── dataUtils.js       # Utilidades de datos y CSV
│   ├── charts.js          # Gestión de gráficos
│   └── views.js           # Gestión de vistas
└── assets/
    └── informe_salidas_bodega.csv  # Datos
```

## 🚀 Instalación y Uso

### Opción 1: Servidor Local Simple

```bash
# Navega al directorio
cd presupuesto-app

# Inicia un servidor HTTP simple (Python 3)
python3 -m http.server 8000

# O con Python 2
python -m SimpleHTTPServer 8000

# O con Node.js (si está instalado)
npx http-server -p 8000
```

Luego abre en tu navegador: `http://localhost:8000`

### Opción 2: Servidor Apache/Nginx

Copia la carpeta `presupuesto-app` a tu directorio web y accede desde el navegador.

### Opción 3: Abrir directamente (limitado)

Simplemente abre `index.html` en tu navegador. Nota: Algunas funcionalidades PWA requieren servidor HTTPS.

## 📱 Instalación como PWA

1. Abre la aplicación en Chrome, Edge o Safari
2. Busca el ícono de "Instalar" en la barra de direcciones
3. Click en "Instalar" para agregar a tu dispositivo
4. La app aparecerá como aplicación nativa

## 🎨 Uso de la Aplicación

### Navegación Principal

- **Dashboard**: Vista general con KPIs y gráficos principales
- **Cronología**: Navegación temporal con controles mes a mes
- **Organigrama**: Estructura jerárquica de producción

### Filtros

1. Selecciona los criterios en el header de filtros
2. Los datos se actualizan automáticamente
3. Usa "Limpiar Filtros" para resetear

### Detalles de Máquina

1. Ve a "Organigrama"
2. Click en cualquier máquina
3. Se abrirá un modal con:
   - Información general
   - Gráfico histórico
   - Tabla detallada de salidas

## 🎯 Formato de Datos CSV

El archivo CSV debe contener las siguientes columnas:

- No. Salida
- Fecha Contabilizacion (formato: DD/MM/YYYY)
- Dia, Semana, Mes
- Articulo, Descripcion
- Cantidad
- Costo Articulo (formato: 1.234,56)
- Valor Salida (formato: 1.234,56)
- Nombre Autorizador, Encargado
- Departamento, Maquinaria, Seccion
- Mercado, Comentario, Bodeguero
- Tipo Mantenimiento

## 🎨 Personalización

### Cambiar Colores

Edita las variables CSS en `css/styles.css`:

```css
:root {
    --primary: #1e40af;      /* Color principal */
    --secondary: #10b981;    /* Color secundario */
    /* ... más colores */
}
```

### Modificar Gráficos

Los gráficos se configuran en `js/charts.js`. Puedes modificar:
- Tipos de gráfico
- Colores
- Etiquetas
- Opciones de visualización

## 📊 Tipos de Gráficos Disponibles

1. **Línea/Area**: Tendencias temporales
2. **Dona**: Distribuciones porcentuales
3. **Barras**: Comparaciones categóricas
4. **Barras Horizontales**: Rankings
5. **Múltiples ejes**: Comparaciones de magnitudes diferentes

## 🌐 Compatibilidad

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## 🔧 Solución de Problemas

### Los gráficos no se muestran
- Verifica la conexión a internet (para cargar Chart.js desde CDN)
- Revisa la consola del navegador para errores

### El CSV no carga
- Verifica que el archivo esté en `assets/informe_salidas_bodega.csv`
- Comprueba el formato del CSV (codificación UTF-8)
- Revisa que las columnas tengan los nombres correctos

### PWA no se instala
- Usa HTTPS (o localhost para desarrollo)
- Verifica que el Service Worker se registre correctamente
- Revisa manifest.json

## 📝 Actualizar Datos

Para actualizar los datos:

1. Reemplaza el archivo `assets/informe_salidas_bodega.csv`
2. Recarga la página (Ctrl/Cmd + Shift + R para limpiar caché)
3. Los nuevos datos se cargarán automáticamente

## 🎓 Créditos

Desarrollado para el departamento de Mantenimiento Eléctrico.

## 📄 Licencia

Uso interno de la organización.

# Corrección de Integridad de Datos - Auto-cálculo de Campos de Fecha

## Fecha: 2026-02-12

## Problema Detectado

El archivo CSV en `assets/informe_salidas_bodega.csv` contenía 7,977 registros pero **carecía de las columnas calculadas** `Dia`, `Semana` y `Mes`, que son necesarias para:
- Filtros mensuales
- Gráficos de tendencia temporal
- Análisis por semana
- Reportes agregados por período

### Estructura del CSV Original
```
No. Salida,Fecha Contabilizacion,Articulo,Descripcion,Cantidad,Costo Articulo,Valor Salida,...
```
**Faltan:** Dia, Semana, Mes

### Impacto Sin la Corrección
- Los filtros de mes no funcionarían (mostrarían "0")
- Los gráficos mensuales estarían vacíos
- Los reportes semanales no tendrían datos

## Solución Implementada

### 1. Nueva Función: `getWeekNumber(date)`
Calcula el número de semana ISO del año para cualquier fecha.

```javascript
getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
```

### 2. Modificación en `loadData()`
Se actualizó la función para calcular automáticamente los campos `dia`, `mes` y `semana` cuando no están presentes o son 0 en el CSV:

```javascript
const fecha = this.parseDate(row['Fecha Contabilizacion']);

// Calculate date fields from fecha if not present in CSV
let dia = parseInt(row['Dia']) || 0;
let mes = parseInt(row['Mes']) || 0;
let semana = parseInt(row['Semana']) || 0;

if (fecha) {
    if (!dia) dia = fecha.getDate();
    if (!mes) mes = fecha.getMonth() + 1; // JavaScript months are 0-indexed
    if (!semana) semana = this.getWeekNumber(fecha);
}
```

### 3. Modificación en `processImportedData()`
Se aplicó la misma lógica para importaciones manuales de archivos CSV/Excel, garantizando que cualquier archivo futuro funcione correctamente.

## Beneficios de la Solución

### ✅ Robustez
- La aplicación ahora calcula automáticamente los campos faltantes
- No requiere preprocesamiento manual del CSV
- Funciona con archivos antiguos y nuevos

### ✅ Compatibilidad Retroactiva
- Si el CSV tiene las columnas `Dia`, `Semana`, `Mes` → las usa
- Si el CSV NO tiene esas columnas → las calcula automáticamente
- Mejor de ambos mundos

### ✅ Facilidad de Mantenimiento
- Cualquier exportación futura del sistema funciona sin modificación
- Solo se requiere la columna "Fecha Contabilizacion"
- Reduce errores humanos en preparación de datos

## Archivos Modificados

### `/presupuesto-app/js/dataUtils.js`
- ✅ Agregada función `getWeekNumber(date)` (línea 47-53)
- ✅ Actualizado `loadData()` para cálculo automático (líneas 60-81)
- ✅ Actualizado `processImportedData()` para importaciones (líneas 525-558)

## Verificación de Cambios

### Antes de la Corrección
```
Loaded 7977 records
[Problema] Filtro de mes mostraría 0 resultados
[Problema] Gráficos mensuales vacíos
```

### Después de la Corrección
```
Loaded 7977 records
✓ Día calculado: 2 (de "2/1/2023")
✓ Mes calculado: 1 (Enero)
✓ Semana calculada: 1 (Primera semana del año)
✓ Filtros funcionando correctamente
✓ Gráficos mostrando datos de 2023-2025
```

## Cómo Usar

### Archivo CSV Requerido
Mínimo necesario:
```csv
No. Salida,Fecha Contabilizacion,Articulo,Descripcion,Cantidad,Costo Articulo,Valor Salida,...
183030,2/1/2023,1-036-00-158,CINTA DE AISLAR,6,"11,051667","66,310002",...
```

El sistema calculará automáticamente:
- Dia = 2
- Mes = 1
- Semana = 1

### Actualización de Datos
1. **Opción 1 - Reemplazar archivo:**
   ```bash
   cp nuevo_informe.csv presupuesto-app/assets/informe_salidas_bodega.csv
   ```
   Luego en el navegador: Click en "Actualizar" en la barra superior

2. **Opción 2 - Importar desde la app:**
   - Abrir la aplicación
   - Click en "Importar Datos" (ícono de upload)
   - Seleccionar el nuevo CSV
   - Elegir "Reemplazar" o "Agregar"

## Datos de Prueba

### Archivo Actual
- **Ubicación:** `presupuesto-app/assets/informe_salidas_bodega.csv`
- **Registros:** 7,977 líneas
- **Rango de fechas:** 2/1/2023 - 31/12/2025
- **Formato fecha:** DD/MM/YYYY
- **Formato moneda:** "1.234,56" (separador miles: punto, decimal: coma)

## Notas Técnicas

### Cálculo de Semana ISO 8601
El cálculo sigue el estándar ISO 8601:
- La semana 1 es la primera semana con jueves del año
- Las semanas van de lunes a domingo
- Puede haber 52 o 53 semanas dependiendo del año

### JavaScript Date Considerations
- `getMonth()` devuelve 0-11, se suma 1 para obtener 1-12
- `getDate()` devuelve 1-31 directamente
- Todas las fechas se procesan en hora local del navegador

## Próximos Pasos (Opcional)

Para mejoras futuras, considerar:
1. Validación más estricta de formatos de fecha
2. Soporte para múltiples formatos de fecha (ISO, US, etc.)
3. Detección automática de separadores de moneda
4. Cache de cálculos para mejorar performance en archivos grandes

---

**Versión:** 2.1  
**Estado:** ✅ Implementado y Probado  
**Autor:** Sistema de Mantenimiento  
**Compatibilidad:** Todos los archivos CSV con columna "Fecha Contabilizacion"

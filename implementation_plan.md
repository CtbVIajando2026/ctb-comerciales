# Plan de Mejora: Exportación de Excel Inteligente (CRM Visual)

El usuario requiere que el reporte de Excel tenga un aspecto de "CRM Visual", con muchos más datos inteligentes en la hoja 1, y una tabla de totales al final de la hoja 2.

## Propuesta de Cambios

### 1. Hoja 1: Dashboard Analítico (CRM Visual)
Dado que la librería `exceljs` no soporta la creación nativa de "Gráficos de Pastel" o "Gráficos de Líneas" incrustados (los `charts` nativos de Excel son muy complejos y no están 100% soportados para exportación dinámica sin plantillas), la estrategia será **crear un lienzo visualmente impactante usando diseño de celdas, barras de datos, mapas de calor (conditional formatting) y una distribución tipo "Mosaico de KPIs"**.

Se incluirán las siguientes secciones:
- **Resumen Ejecutivo (KPIs Principales):** Total de registros, horas totales, % de tiempo productivo vs administrativo, cantidad de alertas.
- **Rendimiento por Categoría:** Desglose detallado de minutos en Gestión Comercial, Trabajo Administrativo, Reuniones, Almuerzo/Personal, con barras de progreso.
- **Desglose Geográfico (Ciudades):** Tabla de distribución de visitas por ciudad.
- **Top Agencias (Ampliado):** Ranking extendido con tiempo invertido y promedios.
- **Alertas y Riesgos:** Un bloque visual en rojo con el detalle de las alertas.

### 2. Hoja 2: Base de Datos con Totales al Final
Al final de la tabla dinámica (fila `N + 3`), inyectaremos un **Bloque de Resumen Inteligente** que sumará todo:
- Total Minutos Visita Comercial
- Total Minutos Trabajo Administrativo
- Total Minutos Almuerzo/Personal
- Total Minutos Global

## Proceso de Implementación
1. Modificar `lib/exportExcel.ts` para rediseñar completamente la Hoja 1, usando anchos de columna dinámicos, colores de fondo oscuros/claros para crear "tarjetas", y bordes gruesos.
2. Añadir la lógica de sumatorias al final de la Hoja 2.

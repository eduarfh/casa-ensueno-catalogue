# Resumen de Cambios - Sistema de Monedas

## Fecha
28 de septiembre de 2026

## Descripción
Se ha implementado un sistema completo de múltiples monedas que permite a cada producto tener precios en diferentes monedas (CUP, USD, EUR, MLC, etc.).

## Archivos Creados

### 1. Scripts de Base de Datos
- **`scripts/add-currencies-schema.sql`**
  - Crea la tabla `currencies` para el catálogo de monedas
  - Crea la tabla `product_currencies` para la relación producto-moneda con precios
  - Inserta monedas por defecto: CUP, USD, EUR, MLC
  - Configura triggers y constraints

### 2. API Endpoints
- **`app/api/currencies/route.ts`**
  - GET: Obtener todas las monedas activas
  - POST: Crear nueva moneda (admin)
  - PUT: Actualizar moneda existente
  - DELETE: Eliminar moneda (si no tiene productos)

### 3. Documentación
- **`MONEDAS_README.md`**: Guía completa de uso del sistema de monedas
- **`CAMBIOS_SISTEMA_MONEDAS.md`**: Este archivo con el resumen de cambios

## Archivos Modificados

### Base de Datos y API

#### `app/api/products/route.ts`
- **GET**: Ahora incluye las monedas de cada producto con JOIN a `product_currencies` y `currencies`
- **POST**: Valida y guarda las monedas seleccionadas para nuevos productos
- Agregado campo `currencies` en la respuesta JSON

#### `app/api/products/[id]/route.ts`
- **PUT**: Actualiza las monedas del producto (elimina antiguas e inserta nuevas)
- **DELETE**: También elimina las relaciones en `product_currencies` antes de eliminar el producto

### Componentes Frontend

#### `components/product-form.tsx`
- Agregados tipos `Currency` y `ProductCurrency`
- Nuevo estado `availableCurrencies` para cargar monedas desde la API
- Nuevo estado `productCurrencies` para gestionar las monedas seleccionadas
- Nueva sección UI "Monedas y Precios" con checkboxes para seleccionar monedas
- Input de precio por cada moneda seleccionada
- Validación: Al menos una moneda debe estar seleccionada
- Fetch de monedas disponibles al cargar el componente
- Envío de datos de monedas al crear/actualizar producto

#### `components/product-card.tsx`
- Agregada prop `currencies` al tipo `ProductCardProps`
- Formateado de precios para mostrar todas las monedas (ej: "$100 CUP / $4 USD")
- Fallback al precio antiguo si no hay monedas configuradas
- Modo compacto también muestra las monedas

### Páginas

#### `app/product/[id]/page.tsx`
- **generateMetadata**: Incluye monedas en la query y las formatea para meta tags
- **ProductPage**: Query actualizado con JOIN a monedas
- Formateo de precios para mostrar todas las monedas del producto
- Visualización de precios en formato grande con todas las monedas

#### `app/catalog/page.tsx`
- Query actualizado con JOIN para obtener monedas de cada producto
- Agregado campo `currencies` a cada producto en el array resultante
- Los productos se pasan al componente con sus monedas

#### `app/admin/page.tsx`
- Query actualizado para incluir monedas con subquery
- Campo `currencies` agregado al normalizar productos
- Los productos del admin ahora incluyen información de monedas

#### `app/admin/products/[id]/page.tsx`
- Query de edición actualizado para cargar monedas del producto
- Las monedas se pasan al `ProductForm` para pre-llenar el formulario

## Estructura de Datos

### Tabla `currencies`
```sql
- id: UUID
- code: VARCHAR(3) UNIQUE
- symbol: VARCHAR(10)
- name: TEXT
- is_active: BOOLEAN
- display_order: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabla `product_currencies`
```sql
- id: UUID
- product_id: UUID (FK -> products.id)
- currency_id: UUID (FK -> currencies.id)
- price: NUMERIC(10,2)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- UNIQUE(product_id, currency_id)
```

## Flujo de Trabajo

### Crear Producto
1. Usuario accede a `/admin/products/new`
2. Formulario carga monedas disponibles desde `/api/currencies`
3. Usuario selecciona una o más monedas y define precios
4. Al guardar, el POST a `/api/products` incluye array `currencies`
5. Backend inserta producto y relaciones en `product_currencies`

### Editar Producto
1. Usuario accede a `/admin/products/[id]`
2. Query carga producto con sus monedas actuales
3. Formulario pre-llena las monedas seleccionadas y precios
4. Usuario modifica monedas/precios
5. PUT a `/api/products/[id]` elimina monedas antiguas e inserta nuevas

### Visualizar en Catálogo
1. Query en `/catalog` obtiene productos con JOIN a monedas
2. `ProductCard` formatea y muestra: "$100 CUP / $4 USD / €3.50 EUR"
3. Página de detalle muestra precios grandes con todas las monedas

## Validaciones Implementadas

1. **Al menos una moneda**: No se puede crear/actualizar un producto sin seleccionar al menos una moneda
2. **Precio válido**: Cada moneda seleccionada debe tener un precio numérico válido
3. **No duplicados**: Un producto no puede tener la misma moneda dos veces (constraint en DB)
4. **Monedas activas**: Solo se muestran monedas con `is_active = true`
5. **Eliminación protegida**: No se puede eliminar una moneda si tiene productos asociados

## Compatibilidad

- El campo `price` en la tabla `products` se mantiene por compatibilidad
- Los productos existentes sin monedas mostrarán el precio antiguo como fallback
- El sistema es retrocompatible: productos sin monedas seguirán funcionando

## Monedas por Defecto

El script instala estas monedas automáticamente:
1. **CUP** - Peso Cubano ($)
2. **USD** - Dólar Estadounidense ($)
3. **EUR** - Euro (€)
4. **MLC** - MLC ($)

## Próximos Pasos Sugeridos

1. **Panel de Administración de Monedas**: Crear `/admin/currencies` para gestionar monedas visualmente
2. **Tasas de Cambio**: Sistema para convertir precios automáticamente
3. **Selección de Moneda por Usuario**: Permitir a usuarios ver precios en su moneda preferida
4. **Filtros en Catálogo**: Filtrar productos por moneda disponible
5. **Reportes**: Estadísticas de ventas por moneda

## Instrucciones de Despliegue

### 1. Base de Datos
```bash
# Conectar a la base de datos
psql -U tu_usuario -d casaensueno

# Ejecutar script de migración
\i scripts/add-currencies-schema.sql

# Verificar tablas
\dt currencies
\dt product_currencies
SELECT * FROM currencies;
```

### 2. Aplicación
```bash
# No requiere instalación de dependencias nuevas
# Solo reiniciar el servidor de desarrollo
npm run dev
```

### 3. Verificación
1. Accede a `/admin/products/new`
2. Verifica que aparezca la sección "Monedas y Precios"
3. Crea un producto de prueba con múltiples monedas
4. Verifica que se muestre correctamente en el catálogo

## Notas Técnicas

- Se usan transacciones SQL para operaciones críticas
- Los JOIN incluyen `c.is_active = true` para no mostrar monedas desactivadas
- El formato de precios respeta decimales cuando es necesario
- Los símbolos de moneda se almacenan en la BD para fácil personalización
- El `display_order` controla el orden de aparición en el frontend

## Soporte

Para problemas o preguntas, consulta `MONEDAS_README.md` que incluye:
- Guía de uso detallada
- Documentación de API
- Solución de problemas comunes
- Ejemplos de código

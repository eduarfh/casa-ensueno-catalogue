# Sistema de Monedas - Casa Ensueño

## Descripción General

El sistema de monedas permite que cada producto tenga precios en múltiples monedas (CUP, USD, EUR, MLC, etc.). Cada producto puede tener uno o más precios asociados a diferentes monedas.

## Estructura de Base de Datos

### Tabla `currencies`
Almacena el catálogo de monedas disponibles en el sistema.

**Campos:**
- `id`: UUID único de la moneda
- `code`: Código de 3 letras (CUP, USD, EUR, etc.)
- `symbol`: Símbolo de la moneda ($, €, £, etc.)
- `name`: Nombre completo de la moneda
- `is_active`: Indica si la moneda está activa
- `display_order`: Orden de visualización (menor = primero)
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización

### Tabla `product_currencies`
Relación muchos a muchos entre productos y monedas con sus precios específicos.

**Campos:**
- `id`: UUID único del registro
- `product_id`: ID del producto (FK a `products`)
- `currency_id`: ID de la moneda (FK a `currencies`)
- `price`: Precio del producto en esta moneda
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización

**Constraint:** Un producto no puede tener la misma moneda duplicada.

## Instalación

### 1. Ejecutar el Script de Migración

Ejecuta el script SQL en tu base de datos PostgreSQL:

```bash
psql -U tu_usuario -d tu_base_de_datos -f scripts/add-currencies-schema.sql
```

O desde la consola de PostgreSQL:
```sql
\i scripts/add-currencies-schema.sql
```

Este script:
- Crea la tabla `currencies`
- Crea la tabla `product_currencies`
- Inserta las monedas por defecto (CUP, USD, EUR, MLC)
- Configura los triggers para `updated_at`

### 2. Verificar la Instalación

Verifica que las tablas se crearon correctamente:

```sql
-- Ver monedas disponibles
SELECT * FROM currencies;

-- Ver estructura de product_currencies
\d product_currencies
```

## Uso en el Panel de Administración

### Crear un Producto

1. Ve a `/admin/products/new`
2. Rellena la información básica del producto
3. En la sección "Monedas y Precios":
   - Marca las casillas de las monedas que deseas usar
   - Para cada moneda seleccionada, ingresa el precio correspondiente
   - **IMPORTANTE:** Debes seleccionar al menos una moneda
4. Completa el resto del formulario y guarda

### Editar un Producto

1. Ve a `/admin` y selecciona un producto
2. Edita la sección "Monedas y Precios":
   - Puedes agregar o quitar monedas
   - Actualiza los precios según necesites
3. Guarda los cambios

## API Endpoints

### Monedas

#### GET `/api/currencies`
Obtiene todas las monedas activas.

**Respuesta:**
```json
{
  "currencies": [
    {
      "id": "uuid",
      "code": "CUP",
      "symbol": "$",
      "name": "Peso Cubano",
      "is_active": true,
      "display_order": 1
    }
  ]
}
```

#### POST `/api/currencies`
Crea una nueva moneda (solo admin).

**Body:**
```json
{
  "code": "CAD",
  "symbol": "$",
  "name": "Dólar Canadiense",
  "is_active": true,
  "display_order": 5
}
```

#### PUT `/api/currencies`
Actualiza una moneda existente.

#### DELETE `/api/currencies?id=xxx`
Elimina una moneda (solo si no tiene productos asociados).

### Productos con Monedas

#### GET `/api/products`
Obtiene todos los productos con sus monedas.

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "name": "Producto 1",
    "currencies": [
      {
        "currency_id": "uuid",
        "currency_code": "CUP",
        "currency_symbol": "$",
        "currency_name": "Peso Cubano",
        "price": 100.00
      },
      {
        "currency_id": "uuid",
        "currency_code": "USD",
        "currency_symbol": "$",
        "currency_name": "Dólar Estadounidense",
        "price": 4.00
      }
    ]
  }
]
```

#### POST `/api/products`
Crea un producto con monedas.

**Body:**
```json
{
  "name": "Producto Ejemplo",
  "description": "Descripción del producto",
  "price": 100,
  "available": true,
  "category": "Categoría",
  "currencies": [
    {
      "currency_id": "uuid-de-cup",
      "price": 100.00
    },
    {
      "currency_id": "uuid-de-usd",
      "price": 4.00
    }
  ],
  "images": []
}
```

#### PUT `/api/products/[id]`
Actualiza un producto incluyendo sus monedas.

**Body:** Similar al POST, incluye `currencies` para actualizar.

## Visualización en el Catálogo

### Tarjeta de Producto (ProductCard)
Los precios se muestran en formato: `$100 CUP / $4 USD / €3.50 EUR`

### Página de Detalle del Producto
Los precios se muestran en formato grande con todas las monedas disponibles.

## Consideraciones

1. **Campo `price` en `products`**: Se mantiene por compatibilidad, pero los precios reales vienen de `product_currencies`. Puedes usarlo como precio de referencia o dejarlo como está.

2. **Monedas por defecto**: El script instala CUP, USD, EUR y MLC. Puedes agregar más desde la API o directamente en la base de datos.

3. **Validación**: El sistema valida que:
   - Al menos una moneda debe estar seleccionada por producto
   - No se pueden duplicar monedas para el mismo producto
   - No se puede eliminar una moneda que tiene productos asociados

4. **Orden de visualización**: Usa `display_order` en la tabla `currencies` para controlar el orden en que aparecen las monedas en el frontend.

## Solución de Problemas

### Error: "Debes seleccionar al menos una moneda"
- Verifica que hayas marcado al menos una casilla de moneda
- Asegúrate de haber ingresado un precio válido para cada moneda seleccionada

### Las monedas no aparecen en el formulario
- Verifica que el script de migración se ejecutó correctamente
- Comprueba que hay monedas con `is_active = true` en la tabla `currencies`

### No se pueden guardar las monedas
- Revisa los logs del servidor para ver errores específicos
- Verifica que las tablas `currencies` y `product_currencies` existen
- Asegúrate de que los IDs de moneda son válidos

## Próximos Pasos

1. **Gestión de Monedas en Admin**: Puedes crear una página en `/admin/currencies` para gestionar las monedas desde el panel de administración.

2. **Conversión Automática**: Implementar un sistema de tasas de cambio para convertir precios automáticamente.

3. **Filtrado por Moneda**: Permitir filtrar productos en el catálogo por moneda disponible.

4. **Moneda por Defecto**: Permitir que los usuarios seleccionen su moneda preferida para mostrar precios.

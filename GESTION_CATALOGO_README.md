# Gestión de Catálogo - Categorías y Monedas

## Descripción General

Se ha implementado un sistema completo de gestión de catálogo que permite administrar **categorías** y **monedas** desde el panel de administración. Estas funcionalidades están centralizadas en la página de configuración de la tienda.

## Características Implementadas

### 1. Página de Configuración de la Tienda (`/admin/store`)

La página se ha reorganizado como un hub central con tres secciones:

- **Información de la Tienda**: Botón para acceder al formulario de edición
  - Nombre de la tienda
  - Ubicación y coordenadas
  - Horarios de atención
  - Contactos de WhatsApp
  
- **Gestión de Catálogo**: Sección con accesos rápidos
  - Botón para gestionar **Categorías**
  - Botón para gestionar **Monedas**

### 1. Página de Configuración de la Tienda (`/admin/store`)

**Funcionalidades:**
- ✅ Hub central de configuración con tres secciones organizadas
- ✅ Botón para "Información de la Tienda" con descripción
- ✅ Botón para "Categorías" con icono y descripción
- ✅ Botón para "Monedas" con icono y descripción
- ✅ Navegación clara desde el dashboard admin
- ✅ Diseño en tarjetas con iconos visuales

**Flujo de Trabajo:**
1. Usuario accede desde `/admin` → clic en "Configuración de la Tienda"
2. Ve tres opciones organizadas en tarjetas
3. Selecciona la sección que desea configurar
4. Cada sección tiene su propia página dedicada

### 2. Información de la Tienda (`/admin/store/info`)

**Funcionalidades:**
- ✅ Formulario completo para editar información de la tienda
- ✅ Campos: nombre, teléfono, WhatsApp, dirección, ubicación (lat/lng), horarios
- ✅ Gestión de múltiples contactos de WhatsApp
- ✅ Botón "Volver a configuración" para navegación fácil
- ✅ Actualización en tiempo real en el footer del catálogo

**Flujo de Trabajo:**
1. Usuario accede desde `/admin/store` → clic en "Editar Información de la Tienda"
2. Edita los campos necesarios
3. Guarda los cambios
4. Los cambios se reflejan en el footer del catálogo público

### 3. Gestión de Categorías (`/admin/categories`)

**Funcionalidades:**
- ✅ Ver todas las categorías existentes con contador de productos
- ✅ Crear nuevas categorías
- ✅ Editar/renombrar categorías existentes
  - Los cambios se aplican automáticamente a todos los productos
- ✅ Eliminar categorías
  - Con confirmación si tienen productos asociados
  - Los productos quedan sin categoría tras eliminarla
- ✅ Información contextual sobre el comportamiento del sistema

**Flujo de Trabajo:**
1. Usuario accede desde `/admin/store` → clic en "Categorías"
2. Ve lista de categorías con su conteo de productos
3. Puede crear, editar o eliminar según necesite
4. Los cambios se reflejan inmediatamente en todos los productos

### 4. Gestión de Monedas (`/admin/currencies`)

**Mejoras Implementadas:**
- ✅ Botón "Volver a configuración" para navegación fácil
- ✅ Indicadores de estado de procesamiento
- ✅ Tarjeta informativa sobre el comportamiento de monedas
- ✅ Diseño consistente con la gestión de categorías
- ✅ Protección contra operaciones simultáneas

**Funcionalidades:**
- Crear, editar, eliminar monedas
- Activar/desactivar monedas
- Control de orden de visualización
- Validación de eliminación (solo si no tiene productos)

## API de Categorías

### GET `/api/categories`
Obtiene todas las categorías con su conteo de productos.

**Respuesta:**
```json
{
  "categories": [
    {
      "name": "Electrónica",
      "count": 15
    },
    {
      "name": "Ropa",
      "count": 23
    }
  ]
}
```

### POST `/api/categories`
Crea/valida una nueva categoría.

**Body:**
```json
{
  "name": "Muebles"
}
```

**Respuesta:**
```json
{
  "message": "Categoría lista para usar",
  "category": {
    "name": "Muebles",
    "count": 0
  }
}
```

### PUT `/api/categories`
Renombra una categoría en todos los productos.

**Body:**
```json
{
  "oldName": "Electronica",
  "newName": "Electrónica"
}
```

**Respuesta:**
```json
{
  "message": "Categoría actualizada correctamente",
  "updatedCount": 15
}
```

### DELETE `/api/categories?name=xxx`
Elimina una categoría (establece NULL en productos).

**Respuesta:**
```json
{
  "message": "Categoría eliminada de 15 productos",
  "deletedCount": 15
}
```

## Estructura de Archivos

### Nuevos Archivos

```
app/
├── admin/
│   ├── store/
│   │   └── info/
│   │       └── page.tsx       ✨ Información de la tienda
│   ├── categories/
│   │   └── page.tsx           ✨ Gestión de categorías
│   └── currencies/
│       └── page.tsx            ⚡ Mejorado con AdminGuard y navegación
│
├── api/
│   └── categories/
│       └── route.ts            ✨ API CRUD de categorías
```

### Archivos Modificados

```
app/
└── admin/
    └── store/
        └── page.tsx           🔄 Reorganizado con botones de gestión
```

## Navegación

```
Panel Admin (/admin)
    ↓
Configuración (/admin/store)
    ├─→ Información de la Tienda (/admin/store/info)
    │   └─ Editar nombre, ubicación, horarios, contactos
    │
    ├─→ Categorías (/admin/categories)
    │   ├─ Ver lista
    │   ├─ Crear nueva
    │   ├─ Editar
    │   └─ Eliminar
    │
    └─→ Monedas (/admin/currencies)
        ├─ Ver lista
        ├─ Crear nueva
        ├─ Editar
        └─ Eliminar
```

## API de Categorías

### GET `/api/categories`
Obtiene todas las categorías con su conteo de productos.

**Respuesta:**
```json
{
  "categories": [
    {
      "name": "Electrónica",
      "count": 15
    },
    {
      "name": "Ropa",
      "count": 23
    }
  ]
}
```

### POST `/api/categories`
Crea/valida una nueva categoría.

**Body:**
```json
{
  "name": "Muebles"
}
```

**Respuesta:**
```json
{
  "message": "Categoría lista para usar",
  "category": {
    "name": "Muebles",
    "count": 0
  }
}
```

### PUT `/api/categories`
Renombra una categoría en todos los productos.

**Body:**
```json
{
  "oldName": "Electronica",
  "newName": "Electrónica"
}
```

**Respuesta:**
```json
{
  "message": "Categoría actualizada correctamente",
  "updatedCount": 15
}
```

### DELETE `/api/categories?name=xxx`
Elimina una categoría (establece NULL en productos).

**Respuesta:**
```json
{
  "message": "Categoría eliminada de 15 productos",
  "deletedCount": 15
}
```

## Comportamiento del Sistema

### Categorías

#### Crear
- Las categorías no se almacenan en tabla separada
- Se crean implícitamente cuando se asignan a productos
- El endpoint POST valida unicidad pero no persiste

#### Renombrar
- Actualiza el campo `category` en **todos** los productos
- Se actualiza también `updated_at` de cada producto
- Operación atómica y segura

#### Eliminar
- Establece `category = NULL` en todos los productos afectados
- Muestra confirmación si hay productos asociados
- No se puede deshacer, pero los productos siguen existiendo

### Monedas

#### Estados de Procesamiento
- `"create"` - Creando nueva moneda
- `{currency.id}` - Procesando operación en moneda específica
- `null` - Sin operaciones en curso

#### Validaciones
- No se puede eliminar una moneda con productos asociados
- El código debe ser de 3 letras
- Los campos code, symbol y name son requeridos
- Solo monedas activas aparecen al crear/editar productos

## Interfaz de Usuario

### Diseño Consistente

Ambas páginas (categorías y monedas) comparten:
- ✅ Header con título y descripción
- ✅ Botón "Volver a configuración" en la esquina superior izquierda
- ✅ Botón "Nueva X" en la esquina superior derecha
- ✅ Formulario de creación en tarjeta expandible
- ✅ Tarjeta informativa con fondo azul
- ✅ Lista de items en tarjetas individuales
- ✅ Botones de acción (Editar, Eliminar)
- ✅ Estados de carga y procesamiento
- ✅ Confirmaciones antes de eliminar
- ✅ Toast notifications para feedback

### Tarjetas Informativas

**Categorías:**
- Las categorías vacías se pueden eliminar sin problemas
- Al eliminar una categoría con productos, estos quedan sin categoría
- Al renombrar, todos los productos se actualizan automáticamente

**Monedas:**
- Cada producto puede tener precios en múltiples monedas
- Solo se pueden eliminar monedas sin productos asociados
- El orden controla la visualización en el catálogo
- Monedas inactivas no aparecen al crear/editar productos

## Seguridad

### Autenticación
- Todas las operaciones requieren sesión de admin
- Cookie `admin-session` validada en cada request
- Respuesta 401 Unauthorized si no hay sesión

### Validaciones
- Nombres vacíos no permitidos
- Duplicados detectados (case-insensitive)
- Confirmaciones para operaciones destructivas
- Protección contra operaciones simultáneas

## Integración con Productos

### Al Crear Producto
1. Usuario selecciona categoría del combobox
2. Usuario selecciona monedas y define precios
3. El sistema valida que haya al menos una categoría y una moneda
4. Se guarda el producto con sus relaciones

### Al Editar Categoría
1. Admin renombra una categoría
2. Sistema actualiza TODOS los productos con esa categoría
3. Los productos reflejan el nuevo nombre inmediatamente

### Al Eliminar Categoría
1. Admin elimina categoría
2. Sistema establece `category = NULL` en productos
3. Productos quedan visibles pero sin categoría asignada
4. Al editar esos productos, admin puede asignar nueva categoría

## Próximas Mejoras Sugeridas

1. **Categorías Jerárquicas**
   - Subcategorías (Electrónica → Celulares, Laptops, etc.)
   - Navegación en árbol

2. **Bulk Operations**
   - Asignar categoría a múltiples productos
   - Cambiar precios en lote

3. **Importación/Exportación**
   - CSV de categorías
   - Plantillas de precios

4. **Auditoría**
   - Historial de cambios de categorías
   - Log de actualizaciones de precios

5. **Búsqueda y Filtros**
   - Buscar categorías por nombre
   - Filtrar monedas activas/inactivas

## Solución de Problemas

### Las categorías no aparecen
- Verifica que haya productos creados con categorías
- El sistema obtiene categorías únicas de la tabla `products`

### No puedo eliminar una moneda
- La moneda está asociada a productos en `product_currencies`
- Primero debes eliminar esos productos o cambiar sus monedas

### Los cambios no se reflejan
- Verifica la consola del navegador para errores
- Confirma que la sesión de admin sigue activa
- Recarga la página para ver los cambios

### Error 401 Unauthorized
- Tu sesión de admin expiró
- Vuelve a iniciar sesión en `/auth/login`

## Testing

### Pruebas Manuales

**Categorías:**
1. ✅ Crear categoría nueva
2. ✅ Crear categoría duplicada (debe fallar)
3. ✅ Renombrar categoría con productos
4. ✅ Renombrar a nombre existente (debe fallar)
5. ✅ Eliminar categoría vacía
6. ✅ Eliminar categoría con productos (confirmar)
7. ✅ Verificar productos actualizados

**Monedas:**
1. ✅ Crear moneda nueva
2. ✅ Editar moneda existente
3. ✅ Activar/desactivar moneda
4. ✅ Cambiar orden de visualización
5. ✅ Eliminar moneda sin productos
6. ✅ Intentar eliminar moneda con productos (debe fallar)

## Conclusión

El sistema de gestión de catálogo está completo y funcional, proporcionando una interfaz intuitiva para administrar categorías y monedas desde un punto central de configuración. El diseño es consistente, la navegación es clara, y todas las operaciones están protegidas con validaciones y confirmaciones apropiadas.

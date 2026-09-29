# Comportamiento de Header con Scroll

## Descripción
Los headers del proyecto (AdminHeader y SiteHeader) ahora tienen un comportamiento dinámico que responde al scroll:
- **Scroll hacia abajo**: El header desaparece con una animación sutil hacia arriba
- **Scroll hacia arriba**: El header aparece con una animación sutil hacia abajo
- **En la parte superior (< 10px)**: El header siempre está visible

## Implementación

### Hook Personalizado: `useScrollDirection`
**Ubicación**: `hooks/use-scroll-direction.ts`

Este hook detecta la dirección del scroll y devuelve un booleano que indica si el header debe ser visible:

```typescript
const isVisible = useScrollDirection();
```

**Características**:
- Usa `requestAnimationFrame` para optimizar el rendimiento (throttling)
- Siempre muestra el header cuando estás en la parte superior de la página
- Solo oculta el header después de hacer scroll más de 100px hacia abajo
- Responde inmediatamente al scroll hacia arriba

### Componentes Actualizados

#### AdminHeader y SiteHeader
- Cambiaron de `position: sticky` a `position: fixed`
- Se agregó transición CSS suave: `transition-transform duration-300 ease-in-out`
- La clase `translate-y-0` / `-translate-y-full` controla la visibilidad
- Ambos componentes usan el hook `useScrollDirection`

### Espaciador para Contenido

Como los headers ahora son `fixed`, se agregó un espaciador en todas las páginas para compensar el espacio:

```tsx
<div className="h-24 sm:h-28 md:h-32" />
```

Este espaciador se coloca inmediatamente después del componente header en cada página.

## Páginas Actualizadas

### Páginas Públicas
- ✅ `/` (Home)
- ✅ `/catalog` (Catálogo)
- ✅ `/product/[id]` (Detalle de producto)
- ✅ `/catalog/loading` (Loading de catálogo)
- ✅ `/loading` (Loading principal)
- ✅ `/product/[id]/loading` (Loading de producto)

### Páginas de Administración
- ✅ `/admin` (Dashboard principal)
- ✅ `/admin/products/new` (Nuevo producto)
- ✅ `/admin/products/[id]` (Editar producto)
- ✅ `/admin/store` (Configuración de tienda)
- ✅ `/admin/store/info` (Información de tienda)
- ✅ `/admin/settings` (Configuración)
- ✅ `/admin/categories` (Categorías)
- ✅ `/admin/currencies` (Monedas)

## Detalles Técnicos

### Animación CSS
```css
transition-transform duration-300 ease-in-out
```
- **duration-300**: La animación dura 300ms (0.3 segundos) - sutil y rápida
- **ease-in-out**: Aceleración suave al inicio y final de la animación

### Z-Index
Los headers mantienen `z-50` para asegurar que estén por encima del contenido

### Responsive
El espaciador se ajusta según el tamaño de pantalla:
- Mobile (default): 96px (h-24)
- Small (sm): 112px (h-28)
- Medium+ (md): 128px (h-32)

## Beneficios

1. **Más espacio visual**: Al hacer scroll hacia abajo, el usuario tiene más espacio para ver el contenido
2. **Acceso rápido**: Al hacer scroll hacia arriba (aunque sea un poco), el header vuelve inmediatamente
3. **UX moderna**: Comportamiento común en aplicaciones web modernas
4. **Rendimiento optimizado**: Uso de `requestAnimationFrame` para animaciones suaves sin lag
5. **Animaciones sutiles**: Transiciones suaves y rápidas (300ms) para no distraer

## Mantenimiento

### Para agregar el comportamiento a una nueva página:

1. Importa el header correspondiente
2. Agrega el espaciador inmediatamente después del header:

```tsx
import { AdminHeader } from "@/components/admin-header";
// o
import SiteHeader from "@/components/site-header";

export default function MyPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader /> {/* o <SiteHeader /> */}
      {/* Espaciador para compensar el header fixed */}
      <div className="h-24 sm:h-28 md:h-32" />
      
      <main>
        {/* Tu contenido aquí */}
      </main>
    </div>
  );
}
```

### Para ajustar el comportamiento:

Edita `hooks/use-scroll-direction.ts`:
- Cambiar umbral de scroll: Ajusta el valor `100` en la línea del condicional
- Cambiar umbral superior: Ajusta el valor `10` para el check de parte superior
- Modificar la velocidad de respuesta: Ajusta la lógica del throttling

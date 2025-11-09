# 📋 Documentación de Endpoints - API Boutique

> **Base URL:** `http://localhost:8000/api/`
> 
> **Última actualización:** 8 de noviembre de 2025

---

## 📑 Índice

1. [Autenticación](#autenticación)
2. [Usuarios](#usuarios)
3. [Productos](#productos)
4. [Inventario](#inventario)
5. [Carritos](#carritos)
6. [Pedidos](#pedidos)
7. [Pagos](#pagos)
8. [Documentación Interactiva](#documentación-interactiva)

---

## 🔐 Autenticación

### Obtener Token (Login)
```http
POST /api/token/
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Refrescar Token
```http
POST /api/token/refresh/
```

**Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## 👤 Usuarios

### Registro de Usuario
```http
POST /api/usuarios/registro/
```
- **Autenticación:** No requerida
- **Body:** `{ email, password, nombre, apellido, telefono }`

### Mi Cuenta

#### Ver mi perfil
```http
GET /api/usuarios/me/
```
- **Autenticación:** Requerida
- **Response:** Datos del usuario autenticado

#### Actualizar mi perfil
```http
PUT/PATCH /api/usuarios/me/
```
- **Autenticación:** Requerida
- **Body:** `{ email, nombre, apellido, telefono }`

#### Ver mi perfil de cliente
```http
GET /api/usuarios/me/profile/
```
- **Autenticación:** Requerida
- **Response:** Datos del perfil del cliente (fecha_nacimiento, genero, preferencias_notificaciones)

#### Actualizar mi perfil de cliente
```http
PUT/PATCH /api/usuarios/me/profile/
```
- **Autenticación:** Requerida
- **Body:** `{ fecha_nacimiento, genero, preferencias_notificaciones }`

### Direcciones del Usuario

#### Listar mis direcciones
```http
GET /api/usuarios/me/addresses/
```
- **Autenticación:** Requerida
- **Response:** Array de direcciones del usuario

#### Crear dirección
```http
POST /api/usuarios/me/addresses/
```
- **Autenticación:** Requerida
- **Body:**
```json
{
  "tipo": "SHIPPING",
  "pais": "Bolivia",
  "ciudad": "La Paz",
  "linea1": "Av. Arce 2631",
  "linea2": "Edificio Torre, Piso 5",
  "codigo_postal": "0000",
  "es_predeterminada": true
}
```

#### Ver detalle de dirección
```http
GET /api/usuarios/me/addresses/{id}/
```
- **Autenticación:** Requerida

#### Actualizar dirección
```http
PUT/PATCH /api/usuarios/me/addresses/{id}/
```
- **Autenticación:** Requerida

#### Eliminar dirección
```http
DELETE /api/usuarios/me/addresses/{id}/
```
- **Autenticación:** Requerida

### Admin - Usuarios

#### Listar usuarios (Admin)
```http
GET /api/usuarios/admin/usuarios/
```
- **Autenticación:** Admin
- **Filtros:** `?search=email&is_active=true&role=CUSTOMER`

#### Ver usuario (Admin)
```http
GET /api/usuarios/admin/usuarios/{id}/
```
- **Autenticación:** Admin

#### Crear usuario (Admin)
```http
POST /api/usuarios/admin/usuarios/
```
- **Autenticación:** Admin

#### Actualizar usuario (Admin)
```http
PUT/PATCH /api/usuarios/admin/usuarios/{id}/
```
- **Autenticación:** Admin

#### Eliminar usuario (Admin)
```http
DELETE /api/usuarios/admin/usuarios/{id}/
```
- **Autenticación:** Admin

### Admin - Perfiles

#### Listar perfiles (Admin)
```http
GET /api/usuarios/admin/perfiles/
```
- **Autenticación:** Admin

#### Ver perfil (Admin)
```http
GET /api/usuarios/admin/perfiles/{id}/
```
- **Autenticación:** Admin

#### Actualizar perfil (Admin)
```http
PUT/PATCH /api/usuarios/admin/perfiles/{id}/
```
- **Autenticación:** Admin

### Admin - Direcciones

#### Listar direcciones (Admin)
```http
GET /api/usuarios/admin/direcciones/
```
- **Autenticación:** Admin
- **Filtros:** `?user={user_id}&tipo=SHIPPING`

#### Ver dirección (Admin)
```http
GET /api/usuarios/admin/direcciones/{id}/
```
- **Autenticación:** Admin

#### Crear dirección (Admin)
```http
POST /api/usuarios/admin/direcciones/
```
- **Autenticación:** Admin

#### Actualizar dirección (Admin)
```http
PUT/PATCH /api/usuarios/admin/direcciones/{id}/
```
- **Autenticación:** Admin

#### Eliminar dirección (Admin)
```http
DELETE /api/usuarios/admin/direcciones/{id}/
```
- **Autenticación:** Admin

---

## 🛍️ Productos

### Vistas Públicas (Cliente)

#### Listar categorías
```http
GET /api/productos/categorias/
```
- **Autenticación:** No requerida
- **Response:** Lista de categorías raíz con sus hijos

#### Listar productos (Catálogo)
```http
GET /api/productos/productos/
```
- **Autenticación:** No requerida
- **Filtros:** `?categoria=slug&search=término&ordering=-fecha_creacion`
- **Response:** Array de productos con sus variantes disponibles

#### Ver detalle de producto
```http
GET /api/productos/productos/{slug}/
```
- **Autenticación:** No requerida
- **Response:** Producto con todas sus variantes, imágenes y stock

### Admin - Categorías

#### Listar categorías (Admin)
```http
GET /api/productos/admin/categorias/
```
- **Autenticación:** Admin

#### Crear categoría (Admin)
```http
POST /api/productos/admin/categorias/
```
- **Autenticación:** Admin
- **Body:** `{ nombre, slug, descripcion, padre }`

#### Ver categoría (Admin)
```http
GET /api/productos/admin/categorias/{id}/
```
- **Autenticación:** Admin

#### Actualizar categoría (Admin)
```http
PUT/PATCH /api/productos/admin/categorias/{id}/
```
- **Autenticación:** Admin

#### Eliminar categoría (Admin)
```http
DELETE /api/productos/admin/categorias/{id}/
```
- **Autenticación:** Admin

### Admin - Atributos

#### Listar atributos (Admin)
```http
GET /api/productos/admin/atributos/
```
- **Autenticación:** Admin

#### Crear atributo (Admin)
```http
POST /api/productos/admin/atributos/
```
- **Autenticación:** Admin
- **Body:** `{ nombre, tipo }`

#### Ver atributo (Admin)
```http
GET /api/productos/admin/atributos/{id}/
```
- **Autenticación:** Admin

#### Actualizar atributo (Admin)
```http
PUT/PATCH /api/productos/admin/atributos/{id}/
```
- **Autenticación:** Admin

#### Eliminar atributo (Admin)
```http
DELETE /api/productos/admin/atributos/{id}/
```
- **Autenticación:** Admin

### Admin - Valores de Atributos

#### Listar valores (Admin)
```http
GET /api/productos/admin/valores/
```
- **Autenticación:** Admin
- **Filtros:** `?atributo={atributo_id}`

#### Crear valor (Admin)
```http
POST /api/productos/admin/valores/
```
- **Autenticación:** Admin
- **Body:** `{ atributo, valor }`

#### Ver valor (Admin)
```http
GET /api/productos/admin/valores/{id}/
```
- **Autenticación:** Admin

#### Actualizar valor (Admin)
```http
PUT/PATCH /api/productos/admin/valores/{id}/
```
- **Autenticación:** Admin

#### Eliminar valor (Admin)
```http
DELETE /api/productos/admin/valores/{id}/
```
- **Autenticación:** Admin

### Admin - Productos

#### Listar productos (Admin)
```http
GET /api/productos/admin/productos/
```
- **Autenticación:** Admin
- **Filtros:** `?categoria={id}&activo=true&search=término`

#### Crear producto (Admin)
```http
POST /api/productos/admin/productos/
```
- **Autenticación:** Admin
- **Body:**
```json
{
  "nombre": "Producto Test",
  "slug": "producto-test",
  "descripcion": "Descripción",
  "categoria": 1,
  "precio_base": "100.00",
  "activo": true
}
```

#### Ver producto (Admin)
```http
GET /api/productos/admin/productos/{id}/
```
- **Autenticación:** Admin

#### Actualizar producto (Admin)
```http
PUT/PATCH /api/productos/admin/productos/{id}/
```
- **Autenticación:** Admin

#### Eliminar producto (Admin)
```http
DELETE /api/productos/admin/productos/{id}/
```
- **Autenticación:** Admin

### Admin - Variantes de Productos

#### Listar variantes (Admin)
```http
GET /api/productos/admin/variantes/
```
- **Autenticación:** Admin
- **Filtros:** `?producto={producto_id}`

#### Crear variante (Admin)
```http
POST /api/productos/admin/variantes/
```
- **Autenticación:** Admin
- **Body:**
```json
{
  "producto": 1,
  "sku": "PROD-001-XL-RED",
  "precio": "120.00",
  "combinacion_valores": [1, 2]
}
```

#### Ver variante (Admin)
```http
GET /api/productos/admin/variantes/{id}/
```
- **Autenticación:** Admin

#### Actualizar variante (Admin)
```http
PUT/PATCH /api/productos/admin/variantes/{id}/
```
- **Autenticación:** Admin

#### Eliminar variante (Admin)
```http
DELETE /api/productos/admin/variantes/{id}/
```
- **Autenticación:** Admin

### Admin - Imágenes de Productos

#### Listar imágenes (Admin)
```http
GET /api/productos/admin/imagenes/
```
- **Autenticación:** Admin
- **Filtros:** `?producto={producto_id}`

#### Subir imagen (Admin)
```http
POST /api/productos/admin/imagenes/
```
- **Autenticación:** Admin
- **Content-Type:** `multipart/form-data`
- **Body:** `{ producto, imagen, es_principal, orden }`

#### Ver imagen (Admin)
```http
GET /api/productos/admin/imagenes/{id}/
```
- **Autenticación:** Admin

#### Actualizar imagen (Admin)
```http
PUT/PATCH /api/productos/admin/imagenes/{id}/
```
- **Autenticación:** Admin

#### Eliminar imagen (Admin)
```http
DELETE /api/productos/admin/imagenes/{id}/
```
- **Autenticación:** Admin

---

## 📦 Inventario

### Admin - Almacenes

#### Listar almacenes
```http
GET /api/inventario/almacenes/
```
- **Autenticación:** Admin

#### Crear almacén
```http
POST /api/inventario/almacenes/
```
- **Autenticación:** Admin
- **Body:** `{ nombre, ubicacion, activo }`

#### Ver almacén
```http
GET /api/inventario/almacenes/{id}/
```
- **Autenticación:** Admin

#### Actualizar almacén
```http
PUT/PATCH /api/inventario/almacenes/{id}/
```
- **Autenticación:** Admin

#### Eliminar almacén
```http
DELETE /api/inventario/almacenes/{id}/
```
- **Autenticación:** Admin

### Admin - Stock

#### Listar stock
```http
GET /api/inventario/stock/
```
- **Autenticación:** Admin
- **Filtros:** `?variante={variante_id}&almacen={almacen_id}`

#### Crear registro de stock
```http
POST /api/inventario/stock/
```
- **Autenticación:** Admin
- **Body:**
```json
{
  "variante": 1,
  "almacen": 1,
  "cantidad": 100,
  "stock_minimo": 10,
  "stock_maximo": 200
}
```

#### Ver stock
```http
GET /api/inventario/stock/{id}/
```
- **Autenticación:** Admin

#### Actualizar stock
```http
PUT/PATCH /api/inventario/stock/{id}/
```
- **Autenticación:** Admin

#### Eliminar stock
```http
DELETE /api/inventario/stock/{id}/
```
- **Autenticación:** Admin

---

## 🛒 Carritos

### Ver mi carrito
```http
GET /api/carritos/
```
- **Autenticación:** Requerida
- **Response:** Carrito del usuario con sus items

### Items del Carrito

#### Añadir item al carrito
```http
POST /api/carritos/items/
```
- **Autenticación:** Requerida
- **Body:**
```json
{
  "variante": 1,
  "cantidad": 2,
  "atributos_seleccionados": {
    "Talla": "M",
    "Color": "Rojo"
  }
}
```

#### Listar items del carrito
```http
GET /api/carritos/items/
```
- **Autenticación:** Requerida

#### Ver item del carrito
```http
GET /api/carritos/items/{id}/
```
- **Autenticación:** Requerida

#### Actualizar cantidad de item
```http
PUT/PATCH /api/carritos/items/{id}/
```
- **Autenticación:** Requerida
- **Body:** `{ cantidad: 3 }`

#### Eliminar item del carrito
```http
DELETE /api/carritos/items/{id}/
```
- **Autenticación:** Requerida

---

## 📦 Pedidos

### Cliente

#### Crear pedido desde carrito
```http
POST /api/pedidos/crear/
```
- **Autenticación:** Requerida
- **Body:**
```json
{
  "direccion_id": "uuid-de-direccion"
}
```
- **Nota:** Crea un pedido con los items del carrito actual y vacía el carrito

#### Listar mis pedidos
```http
GET /api/pedidos/
```
- **Autenticación:** Requerida
- **Filtros:** `?estado=PENDIENTE&ordering=-fecha_creacion`

#### Ver detalle de mi pedido
```http
GET /api/pedidos/{id}/
```
- **Autenticación:** Requerida
- **Response:** Pedido con items, dirección de envío y pagos asociados

### Admin

#### Listar pedidos (Admin)
```http
GET /api/pedidos/admin/
```
- **Autenticación:** Admin
- **Filtros:** `?estado=PENDIENTE&usuario={user_id}&search=email`

#### Ver pedido (Admin)
```http
GET /api/pedidos/admin/{id}/
```
- **Autenticación:** Admin

#### Actualizar estado de pedido (Admin)
```http
PATCH /api/pedidos/admin/{id}/
```
- **Autenticación:** Admin
- **Body:** `{ estado: "EN_PREPARACION" }`
- **Estados disponibles:**
  - `PENDIENTE`: Pedido creado, esperando pago
  - `EN_VERIFICACION`: Pago QR enviado, esperando verificación
  - `PAGADO`: Pago confirmado
  - `EN_PREPARACION`: Preparando el pedido
  - `ENVIADO`: Pedido enviado
  - `ENTREGADO`: Pedido entregado
  - `CANCELADO`: Pedido cancelado

---

## 💳 Pagos

### Cliente

#### Crear pago
```http
POST /api/pagos/crear/
```
- **Autenticación:** Requerida
- **Body:**
```json
{
  "pedido_id": "uuid-del-pedido",
  "metodo_pago": "STRIPE"
}
```
- **Métodos de pago disponibles:**
  - `STRIPE`: Tarjeta de crédito/débito
  - `QR_MANUAL`: Transferencia bancaria con QR

**Response para STRIPE:**
```json
{
  "client_secret": "pi_xxx_secret_xxx",
  "pago_id": "uuid-del-pago",
  "payment_intent_id": "pi_xxx"
}
```

**Response para QR_MANUAL:**
```json
{
  "id": "uuid-del-pago",
  "pedido": "uuid-del-pedido",
  "monto": "100.00",
  "metodo_pago": "QR_MANUAL",
  "estado": "PENDIENTE",
  ...
}
```

#### Subir comprobante QR
```http
PATCH /api/pagos/{id}/upload-qr/
```
- **Autenticación:** Requerida
- **Content-Type:** `multipart/form-data`
- **Body:** `{ comprobante_qr: [archivo de imagen] }`

#### Confirmar pago Stripe (desarrollo)
```http
POST /api/pagos/confirmar-stripe/
```
- **Autenticación:** Requerida
- **Body:**
```json
{
  "pago_id": "uuid-del-pago",
  "payment_intent_id": "pi_xxx"
}
```
- **Nota:** Este endpoint es para desarrollo local. En producción, Stripe usa webhooks.

#### Listar mis pagos
```http
GET /api/pagos/mis-pagos/
```
- **Autenticación:** Requerida
- **Response:** Array de pagos del usuario con sus estados

### Admin

#### Listar pagos (Admin)
```http
GET /api/pagos/admin/
```
- **Autenticación:** Admin
- **Filtros:** `?estado=PENDIENTE&metodo_pago=QR_MANUAL&pedido__usuario={user_id}`

#### Ver pago (Admin)
```http
GET /api/pagos/admin/{id}/
```
- **Autenticación:** Admin

#### Actualizar pago (Admin)
```http
PATCH /api/pagos/admin/{id}/
```
- **Autenticación:** Admin
- **Body:** `{ estado: "COMPLETADO", notas_admin: "Pago verificado" }`

### Webhook Stripe

#### Webhook de Stripe
```http
POST /api/pagos/webhook/stripe/
```
- **Autenticación:** No (validado con Stripe Signature)
- **Nota:** Este endpoint recibe notificaciones de Stripe cuando un pago se completa
- **Header requerido:** `Stripe-Signature`

---

## 📚 Documentación Interactiva

### Swagger UI
```http
GET /swagger/
```
- Interfaz interactiva con todos los endpoints
- Permite probar las APIs directamente desde el navegador

### ReDoc
```http
GET /redoc/
```
- Documentación estática con mejor diseño
- Ideal para leer la documentación completa

---

## 🔑 Notas Importantes

### Autenticación
La mayoría de los endpoints requieren autenticación mediante JWT. Incluye el token en el header:

```
Authorization: Bearer {access_token}
```

### Permisos
- **Sin autenticación:** Endpoints públicos (productos, categorías, registro)
- **Autenticado:** Endpoints de usuario (carrito, pedidos, pagos propios)
- **Admin:** Endpoints de administración (prefijo `/admin/`)

### Paginación
Los endpoints que retornan listas están paginados por defecto:
- `?page=2` - Ir a la página 2
- `?page_size=20` - Cambiar items por página

### Ordenamiento
Usa el parámetro `ordering`:
- `?ordering=fecha_creacion` - Ascendente
- `?ordering=-fecha_creacion` - Descendente

### Búsqueda
Usa el parámetro `search`:
- `?search=término` - Busca en campos configurados

---

## 📊 Modelos de Datos

### Estados de Pedidos
1. **PENDIENTE** - Pedido creado, esperando pago
2. **EN_VERIFICACION** - Pago QR enviado, esperando validación
3. **PAGADO** - Pago confirmado
4. **EN_PREPARACION** - Preparando el pedido
5. **ENVIADO** - Pedido enviado
6. **ENTREGADO** - Pedido entregado
7. **CANCELADO** - Pedido cancelado

### Estados de Pagos
1. **PENDIENTE** - Esperando pago
2. **COMPLETADO** - Pago verificado
3. **FALLIDO** - Pago rechazado o fallido

### Tipos de Direcciones
- **SHIPPING** - Dirección de envío
- **BILLING** - Dirección de facturación

---

## 🚀 Ejemplos de Uso

### Flujo Completo: Compra de Producto

```bash
# 1. Login
POST /api/token/
Body: { "email": "cliente@ejemplo.com", "password": "pass123" }

# 2. Ver productos
GET /api/productos/productos/

# 3. Ver detalle de producto
GET /api/productos/productos/camiseta-algodon/

# 4. Añadir al carrito
POST /api/carritos/items/
Body: { "variante": 1, "cantidad": 2 }

# 5. Ver mi carrito
GET /api/carritos/

# 6. Crear pedido
POST /api/pedidos/crear/
Body: { "direccion_id": "uuid-direccion" }

# 7. Crear pago con Stripe
POST /api/pagos/crear/
Body: { "pedido_id": "uuid-pedido", "metodo_pago": "STRIPE" }

# 8. Confirmar pago (después de procesar con Stripe)
POST /api/pagos/confirmar-stripe/
Body: { "pago_id": "uuid-pago", "payment_intent_id": "pi_xxx" }

# 9. Ver mis pedidos
GET /api/pedidos/
```

---

**Desarrollado por:** Alan / ELkin2624
**Última actualización:** 8 de noviembre de 2025

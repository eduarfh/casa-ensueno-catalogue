 Server  [AdminDashboard] getUser result: Objecterror: "AuthSessionMissingError: Auth session missing!"hasUser: false[[Prototype]]: Object
forward-logs-shared.ts:95  Server  [AdminDashboard] No user session, redirecting to login
forward-logs-shared.ts:95 [HMR] connected
forward-logs-shared.ts:95 [Vercel Web Analytics] Debug mode is enabled by default in development. No requests will be sent to the server.
forward-logs-shared.ts:95 [Vercel Web Analytics] Running queued event pageview Objectpath: "/admin"route: "/admin"[[Prototype]]: Objectconstructor: ƒ Object()hasOwnProperty: ƒ hasOwnProperty()isPrototypeOf: ƒ isPrototypeOf()propertyIsEnumerable: ƒ propertyIsEnumerable()toLocaleString: ƒ toLocaleString()toString: ƒ toString()valueOf: ƒ valueOf()__defineGetter__: ƒ __defineGetter__()__defineSetter__: ƒ __defineSetter__()__lookupGetter__: ƒ __lookupGetter__()__lookupSetter__: ƒ __lookupSetter__()__proto__: (...)get __proto__: ƒ __proto__()set __proto__: ƒ __proto__()
forward-logs-shared.ts:95 [Vercel Web Analytics] [view] http://localhost:3000/admin Objectdp: "/admin"f: undefinedo: "http://localhost:3000/admin"r: ""sdkn: "@vercel/analytics/next"sdkv: "1.3.1"sv: "0.1.3"ts: 1775601026268[[Prototype]]: Objectconstructor: ƒ Object()hasOwnProperty: ƒ hasOwnProperty()isPrototypeOf: ƒ isPrototypeOf()propertyIsEnumerable: ƒ propertyIsEnumerable()toLocaleString: ƒ toLocaleString()toString: ƒ toString()valueOf: ƒ valueOf()__defineGetter__: ƒ __defineGetter__()__defineSetter__: ƒ __defineSetter__()__lookupGetter__: ƒ __lookupGetter__()__lookupSetter__: ƒ __lookupSetter__()__proto__: (...)get __proto__: ƒ __proto__()set __proto__: ƒ __proto__() /_vercel/insights/view
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 756ms
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 150ms
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 296ms
4forward-logs-shared.ts:95  Server  [Supabase][server] getAll() returned 2 cookies
forward-logs-shared.ts:95  Server  [AdminDashboard] getUser result: Object
forward-logs-shared.ts:95  Server  [AdminDashboard] No user session, redirecting to login
forward-logs-shared.ts:95 [Fast Refresh] rebuilding
forward-logs-shared.ts:95 [Fast Refresh] done in 238ms# Pasos para Diagnosticar el Problema de Login

## Preparación

1. Abre el navegador en modo incógnito (para limpiar cookies)
2. Abre DevTools (F12)
3. Ve a la pestaña Console
4. Ve a la pestaña Network

## Intenta hacer login

Usa uno de estos usuarios:
- **fheduardo136@gmail.com** (con su contraseña)
- **csucah07@gmail.com** (con su contraseña)
- **hlasso2002@gmail.com** (con su contraseña)
- **fonsecaeduar136@gmail.com** (con su contraseña)

## Qué revisar en la consola del navegador

Busca estos logs:
```
[auth/login] signIn result { hasSession: ..., userId: ..., error: ... }
[auth/login] set-session response: 200 { ok: true, ... }
```

## Qué revisar en la terminal del servidor

Busca estos logs:
```
[set-session:XXXXX] start
[set-session:XXXXX] setSession ok; user id: ...
```

## Qué revisar en Network tab

1. Busca la petición a `/api/auth/set-session`
2. Verifica que el status sea 200
3. Ve a la pestaña "Response" y copia el JSON

## Posibles Errores y Qué Significan

### Error: "Invalid login credentials"
- La contraseña es incorrecta
- El email no existe en auth.users
- El usuario está deshabilitado

### Error: "Database error querying schema"
- RLS está bloqueando la consulta (ya lo arreglamos)
- Falta la entrada en admin_users

### Login exitoso pero redirect a /auth/login
- Las cookies no se están estableciendo
- Las cookies no se están leyendo en el servidor

### Error: "Auth session missing"
- Las cookies no llegaron al servidor
- Problema con el dominio de las cookies

## Copia y pega aquí:

1. **Logs de la consola del navegador:**
```
[pega aquí]
```

2. **Logs de la terminal del servidor:**
```
[pega aquí]
```

3. **Response de /api/auth/set-session:**
```
[pega aquí]
```

4. **Cookies en Application tab:**
- Ve a Application → Cookies → http://localhost:3000
- Lista las cookies que empiezan con "sb-"
```
[pega aquí]
```

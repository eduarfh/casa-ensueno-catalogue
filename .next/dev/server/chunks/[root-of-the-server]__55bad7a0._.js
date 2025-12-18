module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/supabase/server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/supabase/server.ts
__turbopack_context__.s([
    "createPublicServerClient",
    ()=>createPublicServerClient,
    "createServerClient",
    ()=>createServerClient,
    "createServerSupabase",
    ()=>createServerSupabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$87$2e$1$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$esm$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@supabase+supabase-js@2.87.1/node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs [app-route] (ecmascript)");
;
async function createServerSupabase({ allowSetCookies = false } = {}) {
    const url = ("TURBOPACK compile-time value", "https://jgxqopmrwuxyfirpvbhz.supabase.co");
    const anon = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpneHFvcG1yd3V4eWZpcnB2Ymh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNTgzMjQsImV4cCI6MjA4MDkzNDMyNH0.H3UFK9WjRG9IZMZBiIuJ51-VBnJ_DdVqEiNuWWi7Oug");
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (!allowSetCookies) {
        // Modo lectura en Server Components: cliente normal sin persist/autorefresh
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$87$2e$1$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$esm$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])(url, anon, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
    }
    // allowSetCookies === true -> usar helper SSR que sí maneja cookies del request
    try {
        const { createServerClient } = await __turbopack_context__.A("[project]/node_modules/.pnpm/@supabase+ssr@0.8.0_@supabase+supabase-js@2.87.1/node_modules/@supabase/ssr/dist/module/index.js [app-route] (ecmascript, async loader)");
        const { cookies } = await __turbopack_context__.A("[project]/node_modules/.pnpm/next@16.0.10_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/headers.js [app-route] (ecmascript, async loader)");
        // cookies() puede ser sync o async en distintas versiones, await cubre ambos casos
        const cookieStore = await cookies();
        const supabase = createServerClient(url, anon, {
            cookies: {
                getAll () {
                    try {
                        return cookieStore?.getAll?.() ?? [];
                    } catch (err) {
                        console.warn("[Supabase][server] cookieStore.getAll() failed:", err);
                        return [];
                    }
                },
                setAll (cookiesToSet) {
                    try {
                        const safeSummary = (cookiesToSet || []).map((c)=>{
                            const val = String(c?.value ?? "");
                            return {
                                name: c?.name,
                                valueLen: val.length,
                                options: c?.options ?? {}
                            };
                        });
                        console.log("[Supabase][server] setAll cookies requested:", safeSummary);
                        if (!cookieStore || typeof cookieStore.set !== "function") {
                            console.warn("[Supabase][server] cookieStore.set not available, cannot persist cookies");
                            return;
                        }
                        cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                    } catch (err) {
                        console.warn("[Supabase][server] failed to set cookies (readonly?, unexpected):", err);
                    }
                }
            }
        });
        return supabase;
    } catch (err) {
        console.warn("[Supabase][server] failed to init SSR helper, falling back to basic client:", err);
        // fallback a cliente normal (sin persist/autorefresh) por seguridad
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$87$2e$1$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$esm$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])(url, anon, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });
    }
}
const createServerClient = createServerSupabase;
function createPublicServerClient() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$87$2e$1$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$esm$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])(("TURBOPACK compile-time value", "https://jgxqopmrwuxyfirpvbhz.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpneHFvcG1yd3V4eWZpcnB2Ymh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNTgzMjQsImV4cCI6MjA4MDkzNDMyNH0.H3UFK9WjRG9IZMZBiIuJ51-VBnJ_DdVqEiNuWWi7Oug"));
}
}),
"[project]/app/api/auth/set-session/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.10_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    const requestId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    try {
        console.log(`[set-session:${requestId}] start`);
        const body = await request.json().catch(()=>({}));
        const { access_token, refresh_token } = body ?? {};
        if (!access_token || !refresh_token) {
            console.warn(`[set-session:${requestId}] missing tokens`);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "access_token and refresh_token required"
            }, {
                status: 400
            });
        }
        // IMPORTANTE: allowSetCookies = true -> permitimos que supabase escriba cookies aquí
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerSupabase"])({
            allowSetCookies: true
        });
        // Si el servidor ya ve un user, devolvemos ok y evitamos re-setear cookies.
        const existing = await supabase.auth.getUser().catch((e)=>({
                error: e
            }));
        if (existing?.data?.user) {
            console.log(`[set-session:${requestId}] server already has user: ${existing.data.user.id}`);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true,
                user: existing.data.user
            });
        }
        // Intentamos setSession (esto pedirá a goTrue escribir cookies)
        const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
        });
        if (error) {
            console.error(`[set-session:${requestId}] supabase.auth.setSession error:`, error);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: error.message ?? String(error)
            }, {
                status: 500
            });
        }
        console.log(`[set-session:${requestId}] setSession ok; user id: ${data?.user?.id ?? "unknown"}`);
        // Para debug: devolvemos getUser para confirmar que el server lee sesión
        const userRes = await supabase.auth.getUser().catch((e)=>({
                error: e
            }));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            user: userRes?.data?.user ?? null,
            getUserError: userRes?.error ? String(userRes.error) : null
        });
    } catch (err) {
        console.error(`[set-session:${requestId}] unexpected error:`, err);
        const message = err instanceof Error ? err.message : String(err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__55bad7a0._.js.map
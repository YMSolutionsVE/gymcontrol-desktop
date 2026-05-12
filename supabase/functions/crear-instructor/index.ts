import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 🔒 1. VALIDACIÓN DE SEGURIDAD JWT (EL CANDADO)
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Falta el token de autorización." }), { status: 401, headers: CORS })
    }
    const token = authHeader.replace("Bearer ", "")

    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.getUser(token)
    if (authUserError || !authUser?.user) {
      return new Response(JSON.stringify({ success: false, error: "Token inválido o expirado." }), { status: 401, headers: CORS })
    }

    // 🔒 2. VALIDAR QUE SEA UN ADMIN
    const { data: callerRole, error: callerRoleError } = await supabaseAdmin
      .from("usuarios_roles")
      .select("rol, gym_id")
      .eq("user_id", authUser.user.id)
      .eq("activo", true)
      .maybeSingle()

    if (callerRoleError || !callerRole || callerRole.rol !== "admin") {
      return new Response(JSON.stringify({ success: false, error: "Solo los administradores pueden realizar esta acción." }), { status: 403, headers: CORS })
    }

    // Extraemos el body
    const body = await req.json()
    const { action } = body

    // ── CAMBIAR CONTRASEÑA ──
    if (action === "cambiar-password") {
      const { userId, password } = body
      if (!userId || !password)
        return new Response(JSON.stringify({ success: false, error: "userId y password requeridos" }), { status: 400, headers: CORS })
      if (password.length < 6)
        return new Response(JSON.stringify({ success: false, error: "La contraseña debe tener al menos 6 caracteres" }), { status: 400, headers: CORS })

      // Opcional pero recomendado: Validar que el admin que cambia la contraseña pertenezca al mismo gimnasio que el usuario
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })
      if (error)
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: CORS })

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: CORS })
    }

    // ── CREAR INSTRUCTOR ──
    const { gymId, nombre, email, password } = body
    if (!gymId || !nombre || !email || !password)
      return new Response(JSON.stringify({ success: false, error: "Faltan campos requeridos" }), { status: 400, headers: CORS })
    if (password.length < 6)
      return new Response(JSON.stringify({ success: false, error: "La contraseña debe tener al menos 6 caracteres" }), { status: 400, headers: CORS })

    // 🔒 3. Validar que el Admin no le esté creando instructores a otro gimnasio
    if (callerRole.gym_id !== gymId) {
       return new Response(JSON.stringify({ success: false, error: "No puedes crear instructores para otro gimnasio." }), { status: 403, headers: CORS })
    }

    const { data: gym, error: gymError } = await supabaseAdmin.from("gimnasios").select("id").eq("id", gymId).single()
    if (gymError || !gym)
      return new Response(JSON.stringify({ success: false, error: "Gimnasio no encontrado" }), { status: 404, headers: CORS })

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { nombre, rol: "instructor" },
    })
    if (authError)
      return new Response(JSON.stringify({ success: false, error: authError.message }), { status: 400, headers: CORS })

    const userId = authData.user.id
    const { error: rolError } = await supabaseAdmin.from("usuarios_roles").insert([{
      user_id: userId, gym_id: gymId, rol: "instructor",
      nombre, email, activo: true,
    }])

    if (rolError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ success: false, error: rolError.message }), { status: 500, headers: CORS })
    }

    return new Response(JSON.stringify({ success: true, instructor: { user_id: userId, nombre, email, gym_id: gymId } }), { status: 200, headers: CORS })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), { status: 500, headers: CORS })
  }
})
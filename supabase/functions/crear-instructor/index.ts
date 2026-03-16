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
    let body: { gymId?: string; nombre?: string; email?: string; password?: string }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Body inválido" }), { status: 400, headers: CORS })
    }

    const { gymId, nombre, email, password } = body

    if (!gymId || !nombre || !email || !password) {
      return new Response(JSON.stringify({ success: false, error: `Faltan campos: gymId=${gymId}, nombre=${nombre}, email=${email}, password=${password ? '***' : 'MISSING'}` }), { status: 400, headers: CORS })
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ success: false, error: "La contraseña debe tener al menos 6 caracteres" }), { status: 400, headers: CORS })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ success: false, error: "Variables de entorno no disponibles" }), { status: 500, headers: CORS })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    // Crear usuario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, rol: "instructor" },
    })

    if (authError) {
      return new Response(JSON.stringify({ success: false, error: `Auth error: ${authError.message}` }), { status: 400, headers: CORS })
    }

    if (!authData?.user?.id) {
      return new Response(JSON.stringify({ success: false, error: "No se obtuvo el ID del usuario creado" }), { status: 500, headers: CORS })
    }

    const userId = authData.user.id

    // Insertar en usuarios_roles
    const { error: rolError } = await supabaseAdmin
      .from("usuarios_roles")
      .insert([{
        user_id: userId,
        gym_id: gymId,
        rol: "instructor",
        nombre,
        email,
        activo: true,
      }])

    if (rolError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ success: false, error: `Rol error: ${rolError.message}` }), { status: 500, headers: CORS })
    }

    return new Response(
      JSON.stringify({
        success: true,
        instructor: { user_id: userId, nombre, email, gym_id: gymId, rol: "instructor" },
      }),
      { status: 200, headers: CORS }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: `Exception: ${(error as Error).message}` }),
      { status: 500, headers: CORS }
    )
  }
})

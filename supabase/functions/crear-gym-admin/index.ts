import { createClient } from "jsr:@supabase/supabase-js@2"

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: CORS })

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")

const buildUniqueSlug = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  baseName: string,
  excludeGymId?: string,
) => {
  const baseSlug = slugify(baseName) || "gym-control"

  const { data, error } = await supabaseAdmin
    .from("gimnasios")
    .select("id, slug")
    .ilike("slug", `${baseSlug}%`)

  if (error) throw error

  const used = new Set(
    (data || [])
      .filter((row) => row.id !== excludeGymId)
      .map((row) => row.slug),
  )
  if (!used.has(baseSlug)) return baseSlug

  let index = 2
  while (used.has(`${baseSlug}-${index}`)) {
    index += 1
  }

  return `${baseSlug}-${index}`
}

const getInitialTasaBcv = async (supabaseAdmin: ReturnType<typeof createClient>) => {
  const { data, error } = await supabaseAdmin
    .from("configuracion")
    .select("tasa_bcv")
    .not("tasa_bcv", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.tasa_bcv ?? null
}

const updateGym = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  body: {
    gymId?: string
    gymName?: string
    adminName?: string
    ciudad?: string
    telefono?: string
    activo?: boolean
    enTrial?: boolean
    trialDays?: number
  },
) => {
  const gymId = body.gymId?.trim()
  if (!gymId) {
    return json({ success: false, error: "gymId es obligatorio." }, 400)
  }

  const { data: gymActual, error: gymActualError } = await supabaseAdmin
    .from("gimnasios")
    .select("*")
    .eq("id", gymId)
    .maybeSingle()

  if (gymActualError) {
    return json({ success: false, error: gymActualError.message }, 500)
  }

  if (!gymActual) {
    return json({ success: false, error: "No se encontró el gym indicado." }, 404)
  }

  const { data: adminActual, error: adminActualError } = await supabaseAdmin
    .from("usuarios_roles")
    .select("user_id, gym_id, nombre, email, activo")
    .eq("gym_id", gymId)
    .eq("rol", "admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (adminActualError) {
    return json({ success: false, error: adminActualError.message }, 500)
  }

  const gymName = body.gymName?.trim() || gymActual.nombre
  const adminName = body.adminName?.trim() || adminActual?.nombre || gymName
  const ciudad = body.ciudad?.trim() || null
  const telefono = body.telefono?.trim() || null
  const activo = typeof body.activo === "boolean" ? body.activo : gymActual.activo
  const enTrial = typeof body.enTrial === "boolean" ? body.enTrial : gymActual.en_trial
  const trialDays = Number(body.trialDays || 0)
  const now = new Date()

  let slug = gymActual.slug
  if (gymName !== gymActual.nombre) {
    slug = await buildUniqueSlug(supabaseAdmin, gymName, gymId)
  }

  const gymUpdate: Record<string, unknown> = {
    nombre: gymName,
    slug,
    ciudad,
    telefono,
    activo,
    en_trial: enTrial,
    updated_at: now.toISOString(),
  }

  if (!enTrial) {
    gymUpdate.trial_start = null
    gymUpdate.trial_end = null
  } else if (trialDays > 0) {
    gymUpdate.trial_start = now.toISOString()
    gymUpdate.trial_end = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString()
  }

  const { error: gymUpdateError } = await supabaseAdmin
    .from("gimnasios")
    .update(gymUpdate)
    .eq("id", gymId)

  if (gymUpdateError) {
    return json({ success: false, error: gymUpdateError.message }, 500)
  }

  const { error: configUpdateError } = await supabaseAdmin
    .from("configuracion")
    .update({
      nombre_gimnasio: gymName,
      updated_at: now.toISOString(),
    })
    .eq("gym_id", gymId)

  if (configUpdateError) {
    return json({ success: false, error: configUpdateError.message }, 500)
  }

  if (adminActual) {
    const { error: adminUpdateError } = await supabaseAdmin
      .from("usuarios_roles")
      .update({
        nombre: adminName,
        activo,
        updated_at: now.toISOString(),
      })
      .eq("user_id", adminActual.user_id)
      .eq("gym_id", gymId)
      .eq("rol", "admin")

    if (adminUpdateError) {
      return json({ success: false, error: adminUpdateError.message }, 500)
    }
  }

  const { data: gymFinal, error: gymFinalError } = await supabaseAdmin
    .from("gimnasios")
    .select("id, nombre, slug, activo, en_trial, trial_start, trial_end, owner_email, ciudad, telefono, created_at, updated_at")
    .eq("id", gymId)
    .maybeSingle()

  if (gymFinalError) {
    return json({ success: false, error: gymFinalError.message }, 500)
  }

  return json({
    success: true,
    gym: gymFinal,
    admin: adminActual
      ? {
          user_id: adminActual.user_id,
          nombre: adminName,
          email: adminActual.email,
          activo,
        }
      : null,
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceKey) {
      return json({ success: false, error: "Variables de entorno no disponibles." }, 500)
    }

    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "Falta el token de autorización." }, 401)
    }

    const token = authHeader.replace("Bearer ", "")
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.getUser(token)
    if (authUserError || !authUser?.user) {
      return json({ success: false, error: "No se pudo validar el usuario autenticado." }, 401)
    }

    const { data: callerRole, error: callerRoleError } = await supabaseAdmin
      .from("usuarios_roles")
      .select("rol, activo")
      .eq("user_id", authUser.user.id)
      .eq("activo", true)
      .maybeSingle()

    if (callerRoleError) {
      return json({ success: false, error: callerRoleError.message }, 500)
    }

    if (!callerRole || callerRole.rol !== "superadmin") {
      return json({ success: false, error: "Solo el superadmin puede gestionar gyms." }, 403)
    }

    let body: {
      action?: string
      gymId?: string
      gymName?: string
      adminName?: string
      email?: string
      password?: string
      ciudad?: string
      telefono?: string
      enTrial?: boolean
      trialDays?: number
    }

    try {
      body = await req.json()
    } catch {
      return json({ success: false, error: "Body inválido." }, 400)
    }

    if (body.action === "update-gym") {
      return await updateGym(supabaseAdmin, body)
    }

    const gymName = body.gymName?.trim()
    const adminName = body.adminName?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password ?? ""
    const ciudad = body.ciudad?.trim() || null
    const telefono = body.telefono?.trim() || null
    const enTrial = Boolean(body.enTrial)
    const trialDays = Number(body.trialDays || 0)

    if (!gymName || !adminName || !email || !password) {
      return json({ success: false, error: "gymName, adminName, email y password son obligatorios." }, 400)
    }

    if (password.length < 6) {
      return json({ success: false, error: "La contraseña debe tener al menos 6 caracteres." }, 400)
    }

    if (enTrial && (!Number.isFinite(trialDays) || trialDays <= 0)) {
      return json({ success: false, error: "Los días de trial deben ser mayores a 0." }, 400)
    }

    const slug = await buildUniqueSlug(supabaseAdmin, gymName)
    const tasaInicial = await getInitialTasaBcv(supabaseAdmin)

    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre: adminName,
        rol: "admin",
        gym_nombre: gymName,
      },
    })

    if (createAuthError || !authData?.user?.id) {
      return json({ success: false, error: createAuthError?.message || "No se pudo crear el usuario en Auth." }, 400)
    }

    const gymId = authData.user.id
    const now = new Date()
    const trialEnd = enTrial ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString() : null

    const cleanup = async () => {
      await supabaseAdmin.from("configuracion").delete().eq("gym_id", gymId)
      await supabaseAdmin.from("usuarios_roles").delete().eq("gym_id", gymId)
      await supabaseAdmin.from("gimnasios").delete().eq("id", gymId)
      await supabaseAdmin.auth.admin.deleteUser(gymId)
    }

    const { error: gymError } = await supabaseAdmin
      .from("gimnasios")
      .insert({
        id: gymId,
        nombre: gymName,
        slug,
        activo: true,
        en_trial: enTrial,
        trial_start: enTrial ? now.toISOString() : null,
        trial_end: trialEnd,
        plan: "base",
        owner_email: email,
        ciudad,
        telefono,
      })

    if (gymError) {
      await cleanup()
      return json({ success: false, error: gymError.message }, 500)
    }

    const { error: roleError } = await supabaseAdmin
      .from("usuarios_roles")
      .insert({
        user_id: gymId,
        gym_id: gymId,
        rol: "admin",
        nombre: adminName,
        email,
        activo: true,
      })

    if (roleError) {
      await cleanup()
      return json({ success: false, error: roleError.message }, 500)
    }

    const { error: configError } = await supabaseAdmin
      .from("configuracion")
      .insert({
        gym_id: gymId,
        nombre_gimnasio: gymName,
        moneda_base: "USD",
        tasa_bcv: tasaInicial,
        precio_mensual: 25,
        precio_diario: 1.5,
      })

    if (configError) {
      await cleanup()
      return json({ success: false, error: configError.message }, 500)
    }

    return json({
      success: true,
      gym: {
        id: gymId,
        nombre: gymName,
        slug,
        owner_email: email,
        en_trial: enTrial,
        trial_end: trialEnd,
      },
      admin: {
        user_id: gymId,
        nombre: adminName,
        email,
        rol: "admin",
      },
    })
  } catch (error) {
    return json({ success: false, error: `Exception: ${(error as Error).message}` }, 500)
  }
})

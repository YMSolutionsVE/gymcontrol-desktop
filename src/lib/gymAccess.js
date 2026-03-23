const DAY_MS = 24 * 60 * 60 * 1000

export const YM_SOLUTIONS_PROFILE = {
  id: 'ym-solutions',
  nombre: 'YM Solutions',
  slug: 'ym-solutions',
  activo: true,
  en_trial: false,
}

const getCaracasDateString = (value = new Date()) =>
  new Date(value).toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })

const getCaracasStartOfDay = (value = new Date()) =>
  new Date(`${getCaracasDateString(value)}T00:00:00`)

export const formatDateEs = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-VE', { timeZone: 'America/Caracas' })
}

export const getDaysUntilDate = (value) => {
  if (!value) return null
  const today = getCaracasStartOfDay()
  const target = getCaracasStartOfDay(value)
  return Math.round((target - today) / DAY_MS)
}

const getAnchorDay = (value) => {
  const anchor = value ? new Date(value) : new Date()
  return anchor.getDate()
}

const buildDateForDay = (year, month, day) => {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, lastDay))
}

export const getNextBillingDate = (gym) => {
  if (!gym?.created_at) return null

  const today = getCaracasStartOfDay()
  const anchorDay = getAnchorDay(gym.created_at)

  let dueDate = buildDateForDay(today.getFullYear(), today.getMonth(), anchorDay)
  if (dueDate < today) {
    dueDate = buildDateForDay(today.getFullYear(), today.getMonth() + 1, anchorDay)
  }

  return dueDate
}

export const getGymAccessState = (role, gym) => {
  if (!role) {
    return {
      allowed: false,
      reason: 'missing-role',
      message: 'No tienes un perfil activo asignado en GymControl.',
    }
  }

  if (role.rol === 'superadmin') {
    return { allowed: true, reason: 'superadmin' }
  }

  if (!role.gym_id || !gym?.id) {
    return {
      allowed: false,
      reason: 'missing-gym',
      message: 'No se encontró el gimnasio asignado a tu cuenta.',
    }
  }

  if (gym.activo === false) {
    return {
      allowed: false,
      reason: 'inactive-gym',
      message: 'Este gimnasio está inactivo. Contacta a YM Solutions para reactivar el acceso.',
    }
  }

  if (gym.en_trial && gym.trial_end) {
    const daysUntilTrialEnd = getDaysUntilDate(gym.trial_end)
    if (daysUntilTrialEnd < 0) {
      return {
        allowed: false,
        reason: 'trial-expired',
        message: `La prueba gratuita venció el ${formatDateEs(gym.trial_end)}. Contacta a YM Solutions para activar la cuenta.`,
      }
    }
  }

  return { allowed: true, reason: 'ok' }
}

export const buildDisplayGymProfile = (role, gym) => {
  if (role?.rol === 'superadmin') {
    return {
      ...YM_SOLUTIONS_PROFILE,
      linked_gym_id: role?.gym_id || gym?.id || null,
      linked_gym_nombre: gym?.nombre || null,
    }
  }

  return gym
}

export const getCommercialNotice = (role, gym) => {
  if (!role || role.rol === 'superadmin' || !gym) return null

  if (gym.en_trial && gym.trial_end) {
    const daysUntilTrialEnd = getDaysUntilDate(gym.trial_end)
    if (daysUntilTrialEnd !== null && daysUntilTrialEnd <= 3 && daysUntilTrialEnd >= 0) {
      return {
        kind: 'trial',
        tone: daysUntilTrialEnd <= 1 ? 'warning' : 'info',
        title: daysUntilTrialEnd === 0
          ? 'Tu prueba gratuita vence hoy'
          : `Tu prueba gratuita vence en ${daysUntilTrialEnd} día${daysUntilTrialEnd === 1 ? '' : 's'}`,
        message: `Mantén el acceso activo antes del ${formatDateEs(gym.trial_end)}. Contacta a YM Solutions para continuar.`,
      }
    }
    return null
  }

  if (gym.activo) {
    const nextBillingDate = getNextBillingDate(gym)
    const daysUntilBilling = getDaysUntilDate(nextBillingDate)

    if (daysUntilBilling !== null && daysUntilBilling <= 3 && daysUntilBilling >= 0) {
      return {
        kind: 'billing',
        tone: daysUntilBilling === 0 ? 'warning' : 'info',
        title: daysUntilBilling === 0
          ? 'Tu mensualidad vence hoy'
          : `Tu mensualidad vence en ${daysUntilBilling} día${daysUntilBilling === 1 ? '' : 's'}`,
        message: `Recuerda estar al día con el pago antes del ${formatDateEs(nextBillingDate)} y contactar a YM Solutions si necesitas apoyo.`,
      }
    }
  }

  return null
}

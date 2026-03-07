import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithEmail } from '../services/authService'
import { useAuth } from '../context/AuthContext'

// ════════════════════════════════════════
// SVG Components
// ════════════════════════════════════════

const DumbbellIcon = ({ size = 200 }) => (
  <svg
    width={size}
    height={size * 0.42}
    viewBox="0 0 240 100"
    fill="none"
  >
    <defs>
      <linearGradient id="dbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <filter id="dbGlow">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#dbGlow)">
      <rect x="12" y="10" width="26" height="80" rx="7" fill="url(#dbGrad)" opacity="0.95" />
      <rect x="38" y="20" width="18" height="60" rx="5" fill="url(#dbGrad)" opacity="0.7" />
      <rect x="56" y="36" width="128" height="28" rx="14" fill="url(#dbGrad)" opacity="0.4" />
      <rect x="184" y="20" width="18" height="60" rx="5" fill="url(#dbGrad)" opacity="0.7" />
      <rect x="202" y="10" width="26" height="80" rx="7" fill="url(#dbGrad)" opacity="0.95" />
    </g>
  </svg>
)

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 4l-10 8L2 4" />
  </svg>
)

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
)

const EyeIcon = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
)

const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="12" width="4" height="9" rx="1" />
    <rect x="10" y="8" width="4" height="13" rx="1" />
    <rect x="17" y="3" width="4" height="18" rx="1" />
  </svg>
)

const DollarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8h-6a2 2 0 000 4h4a2 2 0 010 4H8" />
    <path d="M12 18V6" />
  </svg>
)

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
)

// ════════════════════════════════════════
// Animations CSS
// ════════════════════════════════════════

const animationStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-14px) rotate(1.5deg); }
  }

  @keyframes moveOrb {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(25px, -18px) scale(1.05); }
    66% { transform: translate(-12px, 12px) scale(0.95); }
  }

  @keyframes moveOrb2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-20px, 15px) scale(0.95); }
    66% { transform: translate(18px, -22px) scale(1.05); }
  }

  @keyframes moveOrb3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(15px, -10px) scale(1.08); }
  }

  @keyframes pumpIn {
    0% { transform: translateY(35px) scale(0.8); opacity: 0; }
    35% { transform: translateY(-10px) scale(1.06); opacity: 1; }
    55% { transform: translateY(5px) scale(0.97); opacity: 1; }
    75% { transform: translateY(-3px) scale(1.02); opacity: 1; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }

  @keyframes pumpLoop {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-10px) scale(1.04); }
  }

  @keyframes fadeInUp {
    0% { transform: translateY(18px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes slideInLeft {
    0% { transform: translateX(-30px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideInRight {
    0% { transform: translateX(30px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

  @keyframes loadingProgress {
    0% { width: 0%; }
    100% { width: 100%; }
  }

  @keyframes welcomeFadeOut {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.03); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .gc-login-input {
    width: 100%;
    padding: 14px 14px 14px 46px;
    background: #1a1f2e;
    border: 1px solid #2a3040;
    border-radius: 12px;
    color: #ffffff;
    font-size: 14px;
    outline: none;
    transition: all 0.25s ease;
    box-sizing: border-box;
  }

  .gc-login-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12), 0 0 20px rgba(59, 130, 246, 0.06);
  }

  .gc-login-input::placeholder {
    color: #4b5563;
  }

  .gc-login-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .gc-login-input-password {
    padding-right: 48px;
  }

  .gc-login-btn {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 12px;
    color: #ffffff;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    letter-spacing: 0.03em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .gc-login-btn:not(:disabled) {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }

  .gc-login-btn:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
  }

  .gc-login-btn:not(:disabled):active {
    transform: translateY(0);
  }

  .gc-login-btn:disabled {
    background: #374151;
    cursor: not-allowed;
  }

  @media (max-width: 800px) {
    .gc-login-left { display: none !important; }
    .gc-login-right { flex: 1 1 100% !important; }
  }
`

// ════════════════════════════════════════
// Main Component
// ════════════════════════════════════════

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeGymName, setWelcomeGymName] = useState('')
  const [welcomeFadingOut, setWelcomeFadingOut] = useState(false)
  const isLoggingIn = useRef(false)

  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && !showWelcome && !isLoggingIn.current) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate, showWelcome])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico')
      return
    }
    if (!password) {
      setError('Ingresa tu contraseña')
      return
    }

    setIsSubmitting(true)
    isLoggingIn.current = true

    const result = await loginWithEmail(email, password)

    if (result.success) {
      const nombre = result.gym?.nombre || 'GymControl'
      setWelcomeGymName(nombre)
      setShowWelcome(true)
      isLoggingIn.current = false

      setTimeout(() => setWelcomeFadingOut(true), 2200)
      setTimeout(() => navigate('/home', { replace: true }), 2700)
    } else {
      isLoggingIn.current = false
      const messages = {
        'Invalid login credentials': 'Correo o contraseña incorrectos',
        'Email not confirmed': 'Confirma tu correo electrónico primero'
      }
      setError(messages[result.error] || result.error)
      setIsSubmitting(false)
    }
  }

  // ════════════════════════════════════════
  // WELCOME SCREEN
  // ════════════════════════════════════════

  if (showWelcome) {
    return (
      <>
        <style>{animationStyles}</style>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0a0e1a 0%, #0d1527 50%, #0a0e1a 100%)',
          animation: welcomeFadingOut ? 'welcomeFadeOut 0.5s ease forwards' : 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background orbs */}
          <div style={{
            position: 'absolute', width: 350, height: 350, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
            top: '5%', left: '15%',
            animation: 'moveOrb 16s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute', width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            bottom: '10%', right: '15%',
            animation: 'moveOrb2 20s ease-in-out infinite'
          }} />

          {/* Dumbbell pump animation */}
          <div style={{
            animation: 'pumpIn 0.9s ease-out forwards',
            marginBottom: 36
          }}>
            <div style={{
              animation: 'pumpLoop 1.6s ease-in-out infinite',
              animationDelay: '0.9s'
            }}>
              <DumbbellIcon size={300} />
            </div>
          </div>

          {/* Welcome text */}
          <div style={{
            textAlign: 'center',
            animation: 'fadeInUp 0.7s ease-out forwards',
            animationDelay: '0.5s',
            opacity: 0
          }}>
            <p style={{
              color: '#94a3b8',
              fontSize: 17,
              fontWeight: 400,
              marginBottom: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              Bienvenido a
            </p>
            <h1 style={{
              color: '#ffffff',
              fontSize: 38,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.01em'
            }}>
              {welcomeGymName}
            </h1>
          </div>

          {/* Loading bar */}
          <div style={{
            width: 220,
            height: 3,
            borderRadius: 3,
            background: 'rgba(59,130,246,0.12)',
            marginTop: 44,
            overflow: 'hidden',
            animation: 'fadeInUp 0.6s ease-out forwards',
            animationDelay: '0.7s',
            opacity: 0
          }}>
            <div style={{
              height: '100%',
              borderRadius: 3,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
              backgroundSize: '200% 100%',
              animation: 'loadingProgress 2s ease-in-out forwards, shimmer 1.5s ease-in-out infinite',
              animationDelay: '0.8s',
              width: 0
            }} />
          </div>
        </div>
      </>
    )
  }

  // ════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════

  return (
    <>
      <style>{animationStyles}</style>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#0a0e1a'
      }}>

        {/* ══════ LEFT PANEL — BRANDING ══════ */}
        <div
          className="gc-login-left"
          style={{
            flex: '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, #0a0e1a 0%, #0d1527 40%, #101829 100%)',
            position: 'relative',
            overflow: 'hidden',
            padding: 40,
            animation: 'slideInLeft 0.7s ease-out forwards'
          }}
        >
          {/* Animated orbs */}
          <div style={{
            position: 'absolute', width: 380, height: 380, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            top: '-8%', right: '-10%',
            animation: 'moveOrb 22s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
            bottom: '0%', left: '-8%',
            animation: 'moveOrb2 28s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute', width: 220, height: 220, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,212,170,0.05) 0%, transparent 70%)',
            top: '45%', left: '25%',
            animation: 'moveOrb3 18s ease-in-out infinite'
          }} />

          {/* Separator line */}
          <div style={{
            position: 'absolute', right: 0, top: '15%', bottom: '15%',
            width: 1,
            background: 'linear-gradient(to bottom, transparent, rgba(59,130,246,0.15), rgba(139,92,246,0.15), transparent)'
          }} />

          {/* Floating dumbbell */}
          <div style={{
            animation: 'float 5s ease-in-out infinite',
            marginBottom: 48,
            zIndex: 1
          }}>
            <DumbbellIcon size={260} />
          </div>

          {/* Brand text */}
          <div style={{ textAlign: 'center', zIndex: 1, position: 'relative' }}>
            <h1 style={{
              color: '#ffffff',
              fontSize: 44,
              fontWeight: 800,
              marginBottom: 10,
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              GymControl
            </h1>
            <p style={{
              color: '#94a3b8',
              fontSize: 15,
              fontWeight: 400,
              marginBottom: 48
            }}>
              Sistema de Gestión para Gimnasios
            </p>

            {/* Feature highlights */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              alignItems: 'flex-start'
            }}>
              {[
                { icon: <ChartIcon />, text: 'Control total de tu negocio' },
                { icon: <DollarIcon />, text: 'Pagos en USD y Bolívares' },
                { icon: <UsersIcon />, text: 'Gestión de miembros inteligente' }
              ].map((feat, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    animation: 'fadeInUp 0.5s ease-out forwards',
                    animationDelay: `${0.4 + i * 0.15}s`,
                    opacity: 0
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {feat.icon}
                  </div>
                  <span style={{ color: '#64748b', fontSize: 14, fontWeight: 400 }}>{feat.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* YM Solutions footer */}
          <p style={{
            position: 'absolute',
            bottom: 28,
            color: '#f97316',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            zIndex: 1
          }}>
            por YM Solutions
          </p>
        </div>

        {/* ══════ RIGHT PANEL — FORM ══════ */}
        <div
          className="gc-login-right"
          style={{
            flex: '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0d1117',
            padding: 40,
            position: 'relative',
            animation: 'slideInRight 0.7s ease-out forwards'
          }}
        >
          <div style={{ width: '100%', maxWidth: 380 }}>

            {/* Header */}
            <div style={{ marginBottom: 36 }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: 30,
                fontWeight: 700,
                marginBottom: 10,
                letterSpacing: '-0.01em'
              }}>
                Bienvenido
              </h2>
              <p style={{
                color: '#64748b',
                fontSize: 14,
                fontWeight: 400,
                margin: 0
              }}>
                Ingresa a tu cuenta para continuar
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                animation: 'fadeInUp 0.3s ease-out'
              }}>
                <span style={{ color: '#ef4444', fontSize: 16, lineHeight: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <span style={{ color: '#fca5a5', fontSize: 13 }}>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email field */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  color: '#94a3b8',
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 8,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  Correo Electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#4b5563',
                    display: 'flex'
                  }}>
                    <MailIcon />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gymcontrol.com"
                    className="gc-login-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={{ marginBottom: 28 }}>
                <label style={{
                  display: 'block',
                  color: '#94a3b8',
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 8,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#4b5563',
                    display: 'flex'
                  }}>
                    <LockIcon />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="gc-login-input gc-login-input-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#4b5563',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: 4
                    }}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="gc-login-btn"
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: 18,
                      height: 18,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite'
                    }} />
                    Ingresando...
                  </>
                ) : 'Ingresar'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p style={{
            position: 'absolute',
            bottom: 28,
            color: '#374151',
            fontSize: 11,
            letterSpacing: '0.04em'
          }}>
            GymControl v2.0 — YM Solutions
          </p>
        </div>
      </div>
    </>
  )
}
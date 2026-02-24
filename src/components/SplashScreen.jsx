import React from 'react'

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Gym background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(./gym-bg.jpg)' }}
      />
      
      {/* Dark overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
      
      {/* Content */}
      <div className="relative z-10 text-center space-y-6 px-8">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <img 
            src="./logo-ym-transparent.png" 
            alt="YM Solutions" 
            className="w-28 h-28 object-contain drop-shadow-2xl"
          />
        </div>

        {/* App name */}
        <div className="animate-slide-up-delay">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            GymControl
          </h1>
          <p className="text-gray-300/70 text-base font-light mt-2">
            Sistema de Gestion de Gimnasios
          </p>
        </div>

        {/* Brand */}
        <div className="pt-6 animate-fade-in-delay">
          <p className="text-gray-500 text-xs font-medium tracking-[0.2em] uppercase">
            Powered by
          </p>
          <p className="text-orange-400 text-lg font-semibold mt-1">
            YM Solutions
          </p>
          <p className="text-gray-500/60 text-xs mt-1 italic">
            Mas orden. mas clientes. mas ganancias.
          </p>
        </div>

        {/* Loading dots */}
        <div className="pt-6 flex justify-center gap-1.5">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          <div className="w-2 h-2 bg-orange-400/50 rounded-full animate-bounce" style={{ animationDelay: '0.45s' }} />
        </div>
      </div>
    </div>
  )
}
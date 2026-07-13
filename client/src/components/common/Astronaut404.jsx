function Astronaut404() {
  return (
    <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="astronaut-404">
      <defs>
        <radialGradient id="a404-space-bg" cx="30%" cy="25%" r="90%">
          <stop offset="0%" stopColor="#1b2430"/>
          <stop offset="55%" stopColor="#0f1a24"/>
          <stop offset="100%" stopColor="#0a1018"/>
        </radialGradient>
        <radialGradient id="a404-planet-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4a9070"/>
          <stop offset="70%" stopColor="#2f6f4e"/>
          <stop offset="100%" stopColor="#1f5138"/>
        </radialGradient>
        <linearGradient id="a404-visor-glass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dfeaf5"/>
          <stop offset="45%" stopColor="#9fc3da"/>
          <stop offset="100%" stopColor="#4d7a94"/>
        </linearGradient>
        <linearGradient id="a404-suit-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbfcff"/>
          <stop offset="100%" stopColor="#cdd3de"/>
        </linearGradient>
        <linearGradient id="a404-suit-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c3c9d4"/>
          <stop offset="100%" stopColor="#9aa1af"/>
        </linearGradient>
        <filter id="a404-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Fondo */}
      <rect width="800" height="800" fill="url(#a404-space-bg)"/>

      {/* Estrellas */}
      <g fill="#ffffff">
        <circle cx="60"  cy="90"  r="2"  /><circle cx="130" cy="220" r="1.4"/>
        <circle cx="90"  cy="360" r="1.8"/><circle cx="180" cy="480" r="1.3"/>
        <circle cx="60"  cy="620" r="2"  /><circle cx="230" cy="80"  r="1.5"/>
        <circle cx="330" cy="150" r="1.2"/><circle cx="400" cy="60"  r="1.8"/>
        <circle cx="520" cy="110" r="1.4"/><circle cx="620" cy="70"  r="2"  />
        <circle cx="700" cy="150" r="1.6"/><circle cx="740" cy="260" r="1.3"/>
        <circle cx="760" cy="400" r="2"  /><circle cx="720" cy="540" r="1.4"/>
        <circle cx="680" cy="650" r="1.8"/><circle cx="600" cy="720" r="1.3"/>
        <circle cx="470" cy="750" r="1.6"/><circle cx="340" cy="740" r="1.2"/>
        <circle cx="230" cy="700" r="1.8"/><circle cx="140" cy="650" r="1.3"/>
        <circle cx="380" cy="400" r="1.1"/><circle cx="250" cy="330" r="1.1"/>
        <circle cx="560" cy="330" r="1.1"/><circle cx="480" cy="480" r="1.2"/>
        <circle cx="640" cy="440" r="1.1"/>
      </g>
      {/* Estrellas azuladas */}
      <g fill="#a8c9b6" opacity="0.7">
        <circle cx="150" cy="140" r="3"  />
        <circle cx="650" cy="200" r="3.2"/>
        <circle cx="500" cy="650" r="3"  />
        <circle cx="200" cy="580" r="2.6"/>
      </g>

      {/* Planeta con anillo — colores de la app */}
      <g opacity="0.9">
        <ellipse cx="670" cy="150" rx="95" ry="26" fill="none" stroke="#a8c9b6" strokeWidth="4" opacity="0.55" transform="rotate(-18 670 150)"/>
        <circle cx="670" cy="150" r="46" fill="url(#a404-planet-glow)"/>
        <ellipse cx="670" cy="150" rx="95" ry="26" fill="none" stroke="#e4f1e8" strokeWidth="2" opacity="0.35" transform="rotate(-18 670 150)"/>
      </g>

      {/* Luna pequeña */}
      <circle cx="110" cy="600" r="30" fill="#253040"/>
      <circle cx="100" cy="590" r="6"  fill="#1b2430"/>
      <circle cx="120" cy="612" r="4"  fill="#1b2430"/>

      {/* Cable roto */}
      <path d="M 460 300 C 420 340, 520 380, 470 430 C 430 470, 540 500, 500 540"
            fill="none" stroke="#506273" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 14" opacity="0.6"/>

      {/* Escombros flotantes */}
      <g fill="#304052">
        <polygon points="580,420 610,405 630,430 605,450 585,440"/>
        <polygon points="150,300 170,290 185,308 168,322" opacity="0.8"/>
      </g>

      {/* ====== ASTRONAUTA ====== */}
      <g transform="translate(330,260) rotate(-8)">
        {/* Mochila */}
        <rect x="-46" y="70" width="92" height="120" rx="22" fill="url(#a404-suit-shadow)"/>
        <rect x="-38" y="82" width="76" height="40"  rx="10" fill="#8b93a6"/>

        {/* Piernas */}
        <path d="M -34 170 C -50 220, -46 270, -60 310 L -24 316 C -14 270, -10 220, 2 176 Z"   fill="url(#a404-suit-body)"/>
        <path d="M 34 170 C 50 218, 42 268, 58 306 L 22 314 C 12 268, 8 220, -2 176 Z"          fill="url(#a404-suit-body)"/>
        {/* Botas — primario de la app */}
        <rect x="-70" y="304" width="52" height="30" rx="12" fill="#2f6f4e"/>
        <rect x="20"  y="298" width="52" height="30" rx="12" fill="#2f6f4e" transform="rotate(8 46 313)"/>

        {/* Torso */}
        <path d="M -56 60 C -66 110, -60 165, -40 185 L 40 185 C 62 165, 66 108, 54 58 C 30 40, -30 40, -56 60 Z" fill="url(#a404-suit-body)"/>
        {/* Panel de pecho */}
        <rect x="-24" y="90"  width="48" height="60" rx="10" fill="#e3e7ee" stroke="#aab1c0" strokeWidth="2"/>
        <circle cx="0" cy="108" r="6" fill="#2f6f4e"/>
        <rect x="-14" y="122" width="28" height="6" rx="3" fill="#9aa1af"/>
        <rect x="-14" y="132" width="18" height="6" rx="3" fill="#9aa1af"/>

        {/* Brazo izquierdo (levantado) */}
        <path d="M -50 70 C -90 50, -110 10, -96 -30 C -90 -46, -66 -46, -60 -28 C -70 0, -58 30, -30 50 Z" fill="url(#a404-suit-body)"/>
        <circle cx="-96" cy="-34" r="20" fill="#e3e7ee" stroke="#aab1c0" strokeWidth="2"/>

        {/* Brazo derecho */}
        <path d="M 52 70 C 86 84, 100 120, 86 156 C 80 172, 56 168, 54 150 C 60 124, 48 100, 26 84 Z" fill="url(#a404-suit-shadow)"/>
        <circle cx="82" cy="158" r="18" fill="#cdd3de" stroke="#9aa1af" strokeWidth="2"/>

        {/* Casco */}
        <circle cx="0" cy="-10" r="72" fill="url(#a404-suit-body)"/>
        <circle cx="0" cy="-10" r="72" fill="none" stroke="#aab1c0" strokeWidth="3"/>
        {/* Aro del cuello */}
        <rect x="-30" y="46" width="60" height="16" rx="8" fill="#9aa1af"/>

        {/* Visor */}
        <ellipse cx="0" cy="-6" rx="52" ry="48" fill="url(#a404-visor-glass)"/>
        <ellipse cx="0" cy="-6" rx="52" ry="48" fill="none" stroke="#4d7a94" strokeWidth="3"/>
        {/* Reflejos de estrellas en el visor */}
        <circle cx="-20" cy="-28" r="2.4" fill="#ffffff"/>
        <circle cx="-8"  cy="-34" r="1.6" fill="#ffffff"/>
        <circle cx="14"  cy="-24" r="1.8" fill="#ffffff"/>
        <ellipse cx="-16" cy="4" rx="14" ry="20" fill="#ffffff" opacity="0.18"/>
        {/* Expresión confundida */}
        <circle cx="-14" cy="-4" r="4" fill="#0f1a24" opacity="0.55"/>
        <circle cx="14"  cy="-4" r="4" fill="#0f1a24" opacity="0.55"/>
        <path d="M -10 16 Q 0 10 10 16" stroke="#0f1a24" strokeWidth="2.4" fill="none" opacity="0.55" strokeLinecap="round"/>

        {/* Antena */}
        <line x1="42" y1="-56" x2="52" y2="-84" stroke="#9aa1af" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="53" cy="-88" r="6" fill="#2f6f4e"/>
      </g>
      {/* ====== FIN ASTRONAUTA ====== */}

      {/* Signos de interrogación */}
      <g fontFamily="'IBM Plex Sans', sans-serif" fill="#a8c9b6" opacity="0.85">
        <text x="470" y="130" fontSize="34" transform="rotate(8 470 130)">?</text>
        <text x="230" y="470" fontSize="26" opacity="0.6" transform="rotate(-10 230 470)">?</text>
      </g>

      {/* 404 */}
      <g fontFamily="'IBM Plex Sans', sans-serif" fontWeight="700" textAnchor="middle" filter="url(#a404-soft-glow)">
        <text x="400" y="640" fontSize="150" fill="#e4f1e8" opacity="0.97">404</text>
      </g>

      {/* Divisor — primario */}
      <rect x="300" y="672" width="200" height="4" rx="2" fill="#2f6f4e"/>
    </svg>
  );
}

export default Astronaut404;

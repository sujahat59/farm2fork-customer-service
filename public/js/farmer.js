// Farmer SVG character — reacts to user input
// States: idle | typing | happy | thinking | sleeping

function getFarmerSVG(state = 'idle') {
  const mouth = {
    idle:     'M 62 88 Q 70 93 78 88',
    typing:   'M 60 90 Q 70 86 80 90',
    happy:    'M 58 86 Q 70 98 82 86',
    thinking: 'M 64 90 Q 70 88 76 91',
    sleeping: 'M 63 90 L 77 90',
  };

  const eyes = {
    idle:     `<circle cx="62" cy="74" r="4" fill="#3a2a1a"/>
               <circle cx="78" cy="74" r="4" fill="#3a2a1a"/>
               <circle cx="63.5" cy="72.5" r="1.5" fill="white"/>
               <circle cx="79.5" cy="72.5" r="1.5" fill="white"/>`,
    typing:   `<circle cx="62" cy="74" r="4" fill="#3a2a1a"/>
               <circle cx="78" cy="74" r="4" fill="#3a2a1a"/>
               <circle cx="64" cy="72" r="1.5" fill="white"/>
               <circle cx="80" cy="72" r="1.5" fill="white"/>`,
    happy:    `<path d="M 58 74 Q 62 70 66 74" fill="none" stroke="#3a2a1a" stroke-width="2.5" stroke-linecap="round"/>
               <path d="M 74 74 Q 78 70 82 74" fill="none" stroke="#3a2a1a" stroke-width="2.5" stroke-linecap="round"/>`,
    thinking: `<circle cx="62" cy="74" r="4" fill="#3a2a1a"/>
               <circle cx="78" cy="74" r="4" fill="#3a2a1a"/>
               <circle cx="61" cy="73" r="1.5" fill="white"/>
               <circle cx="77" cy="73" r="1.5" fill="white"/>`,
    sleeping: `<path d="M 58 74 Q 62 77 66 74" fill="none" stroke="#3a2a1a" stroke-width="2.5" stroke-linecap="round"/>
               <path d="M 74 74 Q 78 77 82 74" fill="none" stroke="#3a2a1a" stroke-width="2.5" stroke-linecap="round"/>`,
  };

  const extras = {
    idle:     '',
    typing:   '<text x="88" y="60" font-size="14" opacity="0.7">✏️</text>',
    happy:    `<line x1="56" y1="62" x2="52" y2="56" stroke="#FFB300" stroke-width="1.5"/>
               <line x1="70" y1="58" x2="70" y2="51" stroke="#FFB300" stroke-width="1.5"/>
               <line x1="84" y1="62" x2="88" y2="56" stroke="#FFB300" stroke-width="1.5"/>`,
    thinking: '<text x="82" y="52" font-size="16" opacity="0.6">💭</text>',
    sleeping: `<text x="82" y="58" font-size="13" opacity="0.5">z</text>
               <text x="88" y="50" font-size="11" opacity="0.4">z</text>
               <text x="93" y="43" font-size="9" opacity="0.3">z</text>`,
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 160">
    <!-- Hat brim -->
    <ellipse cx="70" cy="46" rx="36" ry="7" fill="#5D4037"/>
    <!-- Hat top -->
    <rect x="46" y="14" width="48" height="34" rx="6" fill="#6D4C41"/>
    <!-- Hat band -->
    <rect x="46" y="38" width="48" height="7" fill="#4E342E"/>
    <!-- Hat buckle -->
    <rect x="64" y="39" width="12" height="5" rx="1" fill="#FFD600"/>
    <rect x="66" y="40" width="8" height="3" rx="1" fill="#5D4037"/>
    <!-- Face -->
    <circle cx="70" cy="85" r="28" fill="#FFCC80"/>
    <!-- Cheeks -->
    <circle cx="52" cy="88" r="6" fill="#FFAB91" opacity="0.5"/>
    <circle cx="88" cy="88" r="6" fill="#FFAB91" opacity="0.5"/>
    <!-- Eyes -->
    ${eyes[state] || eyes.idle}
    <!-- Nose -->
    <ellipse cx="70" cy="81" rx="3" ry="2" fill="#E59866"/>
    <!-- Mouth -->
    <path d="${mouth[state] || mouth.idle}" fill="none" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Ears -->
    <circle cx="42" cy="85" r="7" fill="#FFCC80"/>
    <circle cx="98" cy="85" r="7" fill="#FFCC80"/>
    <!-- Body / overalls -->
    <path d="M 42 108 Q 70 118 98 108 L 104 148 Q 70 155 36 148 Z" fill="#1565C0"/>
    <!-- Overalls straps -->
    <rect x="55" y="108" width="8" height="22" rx="3" fill="#1976D2"/>
    <rect x="77" y="108" width="8" height="22" rx="3" fill="#1976D2"/>
    <!-- Shirt collar -->
    <path d="M 56 108 Q 70 116 84 108" fill="none" stroke="#E3F2FD" stroke-width="3"/>
    <!-- Extras -->
    ${extras[state] || ''}
  </svg>`;
}

// Farmer controller — call setFarmerState('happy') from anywhere
function initFarmer(wrapperId) {
  const wrap = document.getElementById(wrapperId);
  if (!wrap) return;

  wrap.innerHTML = getFarmerSVG('idle');

  function setState(state) {
    wrap.innerHTML  = getFarmerSVG(state);
    wrap.className  = 'farmer-wrap ' + state;
  }

  // Expose globally
  window.setFarmerState = setState;

  // Idle animation — blink every 3 seconds
  setInterval(() => {
    if (!wrap.classList.contains('typing') && !wrap.classList.contains('happy')) {
      setState('sleeping');
      setTimeout(() => setState('idle'), 300);
    }
  }, 3000);
}

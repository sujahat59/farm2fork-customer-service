const API = 'https://farm2fork-customer-service.onrender.com';
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = 'login.html';
const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

function farmerSVG(hovered) {
  return `<svg viewBox="0 0 100 100" style="width:100%;height:100%;transition:transform 0.3s;${hovered?'transform:scale(1.1)':''}">
    <ellipse cx="50" cy="18" rx="35" ry="8" fill="#8B4513"/>
    <rect x="25" y="10" width="50" height="15" rx="3" fill="#A0522D"/>
    <rect x="30" y="8" width="40" height="5" fill="#8B4513"/>
    <rect x="32" y="14" width="5" height="8" fill="#c9a227" opacity="0.8"/>
    <circle cx="50" cy="50" r="30" fill="#FFDAB9"/>
    <circle cx="40" cy="45" r="${hovered?5:4}" fill="#2F1810" style="transition:all 0.3s"/>
    <circle cx="60" cy="45" r="${hovered?5:4}" fill="#2F1810" style="transition:all 0.3s"/>
    <circle cx="41" cy="44" r="1.5" fill="#fff"/>
    <circle cx="61" cy="44" r="1.5" fill="#fff"/>
    <circle cx="32" cy="55" r="${hovered?8:6}" fill="${hovered?'#ff9999':'#FFB6C1'}" opacity="0.6" style="transition:all 0.3s"/>
    <circle cx="68" cy="55" r="${hovered?8:6}" fill="${hovered?'#ff9999':'#FFB6C1'}" opacity="0.6" style="transition:all 0.3s"/>
    <ellipse cx="50" cy="52" rx="3" ry="4" fill="#DEB887"/>
    <path d="${hovered?'M 35 55 Q 50 70 65 55':'M 40 60 Q 50 65 60 60'}" stroke="#2F1810" stroke-width="2" fill="none" stroke-linecap="round" style="transition:all 0.3s"/>
    <path d="M 25 78 L 30 95 L 45 95 L 50 85 L 55 95 L 70 95 L 75 78" fill="#4169E1"/>
    <rect x="35" y="78" width="30" height="12" fill="#4169E1"/>
    <rect x="42" y="80" width="16" height="8" rx="2" fill="#87CEEB"/>
    <line x1="38" y1="78" x2="42" y2="88" stroke="#FFD700" stroke-width="3"/>
    <line x1="62" y1="78" x2="58" y2="88" stroke="#FFD700" stroke-width="3"/>
    <line x1="70" y1="58" x2="85" y2="50" stroke="#DAA520" stroke-width="2"/>
  </svg>`;
}

function initSidebar(activePage) {
  const pages = [
    { href:'customer.html', label:'Dashboard', icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href:'subscription.html', label:'Subscription', icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { href:'billing.html', label:'Billing', icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { href:'loyalty.html', label:'Loyalty', icon:'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { href:'account.html', label:'Account', icon:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  const farmerWrap = document.getElementById('farmerWrap');
  farmerWrap.innerHTML = farmerSVG(false);
  farmerWrap.addEventListener('mouseenter', () => farmerWrap.innerHTML = farmerSVG(true));
  farmerWrap.addEventListener('mouseleave', () => farmerWrap.innerHTML = farmerSVG(false));

  document.getElementById('sidebarName').textContent = user.name || 'User';

  const nav = document.getElementById('navLinks');
  nav.innerHTML = pages.map(p => `
    <a href="${p.href}" class="nav-link ${p.href===activePage?'active':''}">
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${p.icon}"/></svg>
      ${p.label}
    </a>`).join('');

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  });

  // Floating particles
  const wrap = document.getElementById('particles');
  if (wrap) {
    for (let i=0;i<20;i++){
      const div=document.createElement('div');
      const sz=16+Math.random()*20,rot=Math.random()*360,type=Math.random()>.5?'w':'l';
      div.style.cssText=`position:fixed;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:float ${14+Math.random()*18}s ease-in-out infinite;animation-delay:${Math.random()*-20}s;pointer-events:none;z-index:0;opacity:0.25;`;
      div.innerHTML=type==='w'
        ?`<svg width="${sz}" height="${sz*1.5}" viewBox="0 0 24 36" style="transform:rotate(${rot}deg)"><line x1="12" y1="36" x2="12" y2="8" stroke="#c9a227" stroke-width="2"/><ellipse cx="8" cy="8" rx="4" ry="6" fill="#dbb84d"/><ellipse cx="16" cy="10" rx="4" ry="6" fill="#dbb84d"/><ellipse cx="8" cy="16" rx="4" ry="6" fill="#dbb84d"/><ellipse cx="16" cy="18" rx="4" ry="6" fill="#dbb84d"/></svg>`
        :`<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" style="transform:rotate(${rot}deg)"><path d="M12 2C6 2 2 8 2 14C2 14 6 16 12 16C18 16 22 14 22 14C22 8 18 2 12 2Z" fill="#4a7c4a"/></svg>`;
      wrap.appendChild(div);
    }
  }
}

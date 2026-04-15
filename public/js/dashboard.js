const API = 'http://localhost:3000';

const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) window.location.href = 'login.html';

const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val ?? '—'; }
function setHTML(id, val) { const el = document.getElementById(id); if (el) el.innerHTML  = val; }

function pill(status) {
  const map = { active: 'pill-green', paused: 'pill-orange', cancelled: 'pill-red', pending: 'pill-orange', paid: 'pill-green', failed: 'pill-red' };
  return `<span class="pill ${map[status] || 'pill-grey'}">${status}</span>`;
}

// Sidebar farmer
const farmerSmall = document.getElementById('farmerSmall');
if (farmerSmall) {
  farmerSmall.innerHTML = getFarmerSVG('happy');
}

setText('sidebarName', user.name || 'User');
setText('welcomeMsg',  `Welcome back, ${user.name || 'User'}!`);

async function loadDashboard() {
  const id = user.id;

  // Customer info
  try {
    const res  = await fetch(`${API}/customers/${id}`, { headers });
    const data = await res.json();
    setText('accName',   data.name);
    setText('accEmail',  data.email);
    setText('accPhone',  data.phone || 'Not provided');
    setText('accStatus', data.status);

    if (data.subscriptions?.length > 0) {
      loadSubscription(data.subscriptions[0].id);
    } else {
      setText('subPlan', 'No active subscription');
      setHTML('subStatus', pill('cancelled'));
      setText('subPrice', '—');
    }
  } catch (err) { console.error(err); }

  // Loyalty
  try {
    const res  = await fetch(`${API}/customers/${id}/loyalty`, { headers });
    const data = await res.json();
    setText('loyaltyPoints', data.pointsBalance ?? 0);
    const tierEl = document.getElementById('loyaltyTier');
    if (tierEl) {
      tierEl.textContent = data.tier.charAt(0).toUpperCase() + data.tier.slice(1);
      tierEl.className   = `tier-badge tier-${data.tier}`;
    }
    setHTML('loyaltyHistory', data.history?.length
      ? data.history.slice(0,4).map(h =>
          `<div class="billing-row">
             <span class="stat-label">${h.reason}</span>
             <span style="color:#2d5a27;font-weight:700;">+${h.points} pts</span>
           </div>`).join('')
      : '<p class="empty">No points earned yet</p>');
  } catch (err) { console.error(err); }

  // Billing
  try {
    const res     = await fetch(`${API}/customers/${id}/billing`, { headers });
    const records = await res.json();
    setHTML('billingList', records.length
      ? records.slice(0,5).map(r =>
          `<div class="billing-row">
             <span class="stat-label">${new Date(r.createdAt).toLocaleDateString()}</span>
             <span class="stat-value">$${r.amount.toFixed(2)}</span>
             ${pill(r.status)}
           </div>`).join('')
      : '<p class="empty">No billing records yet</p>');
  } catch (err) { console.error(err); }

  // Total spent
  try {
    const res  = await fetch(`${API}/customers/${id}/billing/total`, { headers });
    const data = await res.json();
    setText('totalSpent',    `$${(data.totalSpent || 0).toFixed(2)}`);
    setText('totalPayments', `${data.totalPayments || 0} payments`);
  } catch (err) { console.error(err); }
}

async function loadSubscription(subId) {
  try {
    const res = await fetch(`${API}/subscriptions/${subId}`, { headers });
    const sub = await res.json();
    setHTML('subStatus',  pill(sub.status));
    setText('subPlan',    sub.planType + ' Plan');
    setText('subBox',     sub.boxType ? sub.boxType.charAt(0).toUpperCase() + sub.boxType.slice(1) + ' Box' : '—');
    setText('subDuration', sub.planDuration || '—');
    setText('subNext',    sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : '—');
    if (sub.billingRecords?.length > 0) {
      setText('subPrice', `$${sub.billingRecords[0].amount.toFixed(2)} / cycle`);
    }
  } catch (err) { console.error(err); }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

loadDashboard();

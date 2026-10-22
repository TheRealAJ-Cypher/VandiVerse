'use strict';

// Global trip state
const VV = {
  trip: {
    originName: '',
    originLat: null,
    originLon: null,
    destinationName: '',
    destinationLat: null,
    destinationLon: null,
    departureDate: '',
    departureTime: '',
    destinationTimezone: 'auto',
  },
  currentPage: 'trip',
  saveTrip() {
    try { localStorage.setItem('vv_trip', JSON.stringify(this.trip)); } catch (_) {}
  },
  loadTrip() {
    try {
      const s = localStorage.getItem('vv_trip');
      if (s) Object.assign(this.trip, JSON.parse(s));
    } catch (_) {}
  },
};

// Page registry — each page script adds itself here
const pages = {};

// API helpers — never throw
async function apiGet(path) {
  try {
    const res = await fetch(path, { headers: { Accept: 'application/json' } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.detail || `HTTP ${res.status}` };
    return { data: json };
  } catch (e) {
    return { error: e.name === 'TypeError' ? 'Network error — is the server running?' : 'Unexpected error.' };
  }
}

async function apiPost(path, body) {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.detail || `HTTP ${res.status}` };
    return { data: json };
  } catch (e) {
    return { error: e.name === 'TypeError' ? 'Network error — is the server running?' : 'Unexpected error.' };
  }
}

// Navigate to a page by id
function navigate(pageId) {
  VV.currentPage = pageId;
  document.querySelectorAll('.nav-tab').forEach(t => {
    const active = t.dataset.page === pageId;
    t.classList.toggle('active', active);
    t.setAttribute('aria-current', active ? 'page' : 'false');
  });
  const content = document.getElementById('page-content');
  if (!content) return;
  const page = pages[pageId];
  if (!page) { content.innerHTML = '<p class="text-muted text-center">Page not found.</p>'; return; }
  content.innerHTML = page.render();
  content.classList.remove('animate-in');
  void content.offsetWidth;
  content.classList.add('animate-in');
  if (typeof page.init === 'function') page.init();
  if (location.hash !== `#${pageId}`) history.replaceState(null, '', `#${pageId}`);
}

document.addEventListener('DOMContentLoaded', () => {
  VV.loadTrip();
  document.querySelectorAll('.nav-tab').forEach(t => t.addEventListener('click', () => navigate(t.dataset.page)));
  const validPages = ['trip', 'weather', 'checklist', 'ai', 'sos'];
  const fromHash = () => { const h = location.hash.slice(1); return validPages.includes(h) ? h : 'trip'; };
  window.addEventListener('hashchange', () => navigate(fromHash()));
  setTimeout(() => navigate(fromHash()), 0);
});

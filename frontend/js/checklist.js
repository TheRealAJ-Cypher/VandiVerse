'use strict';

/**
 * VandiVerse — Preparation Checklists Page
 */
pages['checklist'] = (function () {
  const CAR_ITEMS = [
    { id: 'c1', emoji: '⛽', text: 'Fuel level (fill up if below half)' },
    { id: 'c2', emoji: '🔧', text: 'Engine oil level' },
    { id: 'c3', emoji: '💧', text: 'Coolant and windscreen washer fluid' },
    { id: 'c4', emoji: '🛞', text: 'Tyre pressure including spare wheel' },
    { id: 'c5', emoji: '💡', text: 'All lights working (headlights, indicators, brakes)' },
    { id: 'c6', emoji: '🪟', text: 'Windscreen clean, wipers functional' },
    { id: 'c7', emoji: '🧯', text: 'Fire extinguisher and warning triangle in boot' },
    { id: 'c8', emoji: '🩹', text: 'First-aid kit present and stocked' },
    { id: 'c9', emoji: '📱', text: 'Phone mount and car charger ready' },
    { id: 'c10', emoji: '🗺️', text: 'Offline maps downloaded as backup' },
  ];

  const LUGGAGE_ITEMS = [
    { id: 'l1', emoji: '👕', text: 'Clothes for each day plus one spare set' },
    { id: 'l2', emoji: '🧴', text: 'Toiletries and personal hygiene items' },
    { id: 'l3', emoji: '💊', text: 'Prescription medicine (enough for full trip)' },
    { id: 'l4', emoji: '💳', text: 'IDs, documents, insurance cards' },
    { id: 'l5', emoji: '💰', text: 'Cash for tolls and low-signal areas' },
    { id: 'l6', emoji: '📸', text: 'Charger, power bank, camera' },
    { id: 'l7', emoji: '🍱', text: 'Snacks and filled water bottles' },
    { id: 'l8', emoji: '🎧', text: 'Kids entertainment (tablets, headphones, books)' },
    { id: 'l9', emoji: '🧥', text: 'Warm layer and rain jacket' },
    { id: 'l10', emoji: '👟', text: 'Comfortable walking shoes' },
    { id: 'l11', emoji: '☀️', text: 'Sunscreen and sunglasses' },
    { id: 'l12', emoji: '🔑', text: 'Spare key for accommodation or vehicle' },
  ];

  const ALL_ITEMS = [...CAR_ITEMS, ...LUGGAGE_ITEMS];

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadChecked() {
    try {
      const data = localStorage.getItem('vv_checklist');
      return data ? JSON.parse(data) : {};
    } catch (_) {
      return {};
    }
  }

  function saveChecked(state) {
    try {
      localStorage.setItem('vv_checklist', JSON.stringify(state));
    } catch (_) {}
  }

  let checkedState = loadChecked();

  function calculateCounts() {
    const carDone = CAR_ITEMS.filter(item => Boolean(checkedState[item.id])).length;
    const luggageDone = LUGGAGE_ITEMS.filter(item => Boolean(checkedState[item.id])).length;
    const totalDone = carDone + luggageDone;
    const totalItems = ALL_ITEMS.length;

    const carPct = Math.round((carDone / CAR_ITEMS.length) * 100);
    const luggagePct = Math.round((luggageDone / LUGGAGE_ITEMS.length) * 100);
    const totalPct = Math.round((totalDone / totalItems) * 100);

    return {
      carDone, carTotal: CAR_ITEMS.length, carPct,
      luggageDone, luggageTotal: LUGGAGE_ITEMS.length, luggagePct,
      totalDone, totalItems, totalPct
    };
  }

  function renderItem(item) {
    const isChecked = Boolean(checkedState[item.id]);
    return `
      <div
        class="checklist-item${isChecked ? ' checked' : ''}"
        data-id="${item.id}"
        role="checkbox"
        aria-checked="${isChecked ? 'true' : 'false'}"
        tabindex="0"
      >
        <div class="checklist-checkbox" aria-hidden="true">${isChecked ? '✓' : ''}</div>
        <span class="checklist-emoji" aria-hidden="true">${item.emoji}</span>
        <span class="checklist-text">${esc(item.text)}</span>
      </div>
    `;
  }

  function render() {
    checkedState = loadChecked();
    const stats = calculateCounts();

    const carListHtml = CAR_ITEMS.map(renderItem).join('');
    const luggageListHtml = LUGGAGE_ITEMS.map(renderItem).join('');

    return `
      <section class="checklist-page animate-in">
        <!-- Overall Progress Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-icon" aria-hidden="true">📋</span>
              <div>
                <h2 class="card-title">Total Trip Readiness</h2>
                <p class="card-subtitle">Ensure your car and family essentials are checked</p>
              </div>
            </div>
            <button type="button" id="reset-checklist-btn" class="btn btn-ghost btn-sm" aria-label="Reset all checklist items">
              🔄 Reset
            </button>
          </div>
          <div class="progress-header">
            <span id="overall-progress-text">${stats.totalDone} of ${stats.totalItems} completed</span>
            <span id="overall-progress-pct" class="badge ${stats.totalPct === 100 ? 'badge-success' : 'badge-indigo'}">${stats.totalPct}%</span>
          </div>
          <div class="progress-bar-bg" role="progressbar" aria-valuenow="${stats.totalPct}" aria-valuemin="0" aria-valuemax="100">
            <div id="overall-progress-bar" class="progress-bar-fill" style="width: ${stats.totalPct}%;"></div>
          </div>
        </div>

        <!-- Vehicle Readiness Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-icon" aria-hidden="true">🚗</span>
              <div>
                <h3 class="card-title">Vehicle Readiness</h3>
                <p class="card-subtitle">Safety & roadworthiness checks</p>
              </div>
            </div>
            <span id="car-progress-text" class="badge badge-amber">${stats.carDone}/${stats.carTotal}</span>
          </div>
          <div class="progress-bar-bg">
            <div id="car-progress-bar" class="progress-bar-fill" style="width: ${stats.carPct}%;"></div>
          </div>
          <div class="checklist-list mt-2">
            ${carListHtml}
          </div>
        </div>

        <!-- Family & Luggage Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-icon" aria-hidden="true">🧳</span>
              <div>
                <h3 class="card-title">Family & Luggage</h3>
                <p class="card-subtitle">Packing essentials for smooth journeys</p>
              </div>
            </div>
            <span id="luggage-progress-text" class="badge badge-indigo">${stats.luggageDone}/${stats.luggageTotal}</span>
          </div>
          <div class="progress-bar-bg">
            <div id="luggage-progress-bar" class="progress-bar-fill" style="width: ${stats.luggagePct}%;"></div>
          </div>
          <div class="checklist-list mt-2">
            ${luggageListHtml}
          </div>
        </div>
      </section>
    `;
  }

  function updateDomStats() {
    const stats = calculateCounts();

    const overallText = document.getElementById('overall-progress-text');
    const overallPct = document.getElementById('overall-progress-pct');
    const overallBar = document.getElementById('overall-progress-bar');
    const carText = document.getElementById('car-progress-text');
    const carBar = document.getElementById('car-progress-bar');
    const luggageText = document.getElementById('luggage-progress-text');
    const luggageBar = document.getElementById('luggage-progress-bar');

    if (overallText) overallText.textContent = `${stats.totalDone} of ${stats.totalItems} completed`;
    if (overallPct) {
      overallPct.textContent = `${stats.totalPct}%`;
      overallPct.className = `badge ${stats.totalPct === 100 ? 'badge-success' : 'badge-indigo'}`;
    }
    if (overallBar) overallBar.style.width = `${stats.totalPct}%`;

    if (carText) carText.textContent = `${stats.carDone}/${stats.carTotal}`;
    if (carBar) carBar.style.width = `${stats.carPct}%`;

    if (luggageText) luggageText.textContent = `${stats.luggageDone}/${stats.luggageTotal}`;
    if (luggageBar) luggageBar.style.width = `${stats.luggagePct}%`;
  }

  function toggleItem(id) {
    checkedState[id] = !checkedState[id];
    saveChecked(checkedState);

    const itemEl = document.querySelector(`.checklist-item[data-id="${id}"]`);
    if (itemEl) {
      const isChecked = Boolean(checkedState[id]);
      itemEl.classList.toggle('checked', isChecked);
      itemEl.setAttribute('aria-checked', isChecked ? 'true' : 'false');
      const box = itemEl.querySelector('.checklist-checkbox');
      if (box) box.textContent = isChecked ? '✓' : '';
    }

    updateDomStats();
  }

  function init() {
    checkedState = loadChecked();

    const items = document.querySelectorAll('.checklist-item');
    items.forEach(el => {
      const id = el.dataset.id;
      el.addEventListener('click', () => toggleItem(id));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleItem(id);
        }
      });
    });

    const resetBtn = document.getElementById('reset-checklist-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (window.confirm('Are you sure you want to reset all checklist items?')) {
          checkedState = {};
          saveChecked(checkedState);
          navigate('checklist');
        }
      });
    }
  }

  return {
    render,
    init,
  };
})();

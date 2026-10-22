'use strict';

/**
 * VandiVerse — Trip Setup & Routing Page
 */
pages['trip'] = (function () {
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function todayISO() {
    return new Date().toISOString().split('T')[0];
  }

  function formatCoords(lat, lon) {
    if (lat == null || lon == null) return '';
    return `📍 Coordinates: ${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`;
  }

  function render() {
    const originName = esc(VV.trip.originName || '');
    const destName = esc(VV.trip.destinationName || '');
    const departDate = esc(VV.trip.departureDate || '');
    const departTime = esc(VV.trip.departureTime || '');
    const originCoordsText = formatCoords(VV.trip.originLat, VV.trip.originLon);
    const destCoordsText = formatCoords(VV.trip.destinationLat, VV.trip.destinationLon);

    return `
      <section class="trip-page">
        <!-- Card 1: Starting Point -->
        <div class="card" id="card-origin">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-icon" aria-hidden="true">🚩</span>
              <div>
                <h2 class="card-title">Starting Point</h2>
                <p class="card-subtitle">Where is your family departing from?</p>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="origin-input">Origin City or Address</label>
            <div class="input-with-action geocode-wrapper">
              <input
                type="text"
                id="origin-input"
                class="form-input"
                placeholder="Search origin city (e.g. London, Austin)..."
                autocomplete="off"
                value="${originName}"
                aria-autocomplete="list"
                aria-expanded="false"
                aria-controls="origin-results"
              >
              <button
                type="button"
                id="locate-btn"
                class="btn btn-ghost"
                title="Use Current Location"
                aria-label="Use Current GPS Location"
              >
                📡
              </button>
              <div id="origin-results" class="geocode-results" role="listbox" aria-label="Origin suggestions"></div>
            </div>
            <div id="origin-coords" class="coords-display" aria-live="polite">${esc(originCoordsText)}</div>
          </div>
        </div>

        <!-- Card 2: Destination -->
        <div class="card" id="card-dest">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-icon" aria-hidden="true">🏁</span>
              <div>
                <h2 class="card-title">Destination</h2>
                <p class="card-subtitle">Where is the road taking you?</p>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="dest-input">Destination City or Landmark</label>
            <div class="geocode-wrapper">
              <input
                type="text"
                id="dest-input"
                class="form-input"
                placeholder="Search destination city (e.g. Edinburgh, Denver)..."
                autocomplete="off"
                value="${destName}"
                aria-autocomplete="list"
                aria-expanded="false"
                aria-controls="dest-results"
              >
              <div id="dest-results" class="geocode-results" role="listbox" aria-label="Destination suggestions"></div>
            </div>
            <div id="dest-coords" class="coords-display" aria-live="polite">${esc(destCoordsText)}</div>
          </div>
        </div>

        <!-- Card 3: Departure Details -->
        <div class="card" id="card-departure">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-icon" aria-hidden="true">⏱️</span>
              <div>
                <h2 class="card-title">Departure Schedule</h2>
                <p class="card-subtitle">Set your planned rollout date and time</p>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="depart-date">Departure Date</label>
            <input
              type="date"
              id="depart-date"
              class="form-input"
              min="${todayISO()}"
              value="${departDate}"
            >
          </div>
          <div class="form-group">
            <label class="form-label" for="depart-time">Departure Time</label>
            <input
              type="time"
              id="depart-time"
              class="form-input"
              value="${departTime}"
            >
          </div>
        </div>

        <!-- Trip Summary Section -->
        <div id="trip-summary-section" aria-live="polite"></div>
      </section>
    `;
  }

  function renderTripSummary() {
    const summarySec = document.getElementById('trip-summary-section');
    if (!summarySec) return;

    const hasOrigin = Boolean(VV.trip.originName || VV.trip.originLat != null);
    const hasDest = Boolean(VV.trip.destinationName || VV.trip.destinationLat != null);

    if (!hasOrigin && !hasDest) {
      summarySec.innerHTML = '';
      return;
    }

    const originDisplay = VV.trip.originName || (VV.trip.originLat != null ? `${VV.trip.originLat.toFixed(4)}, ${VV.trip.originLon.toFixed(4)}` : 'Not set');
    const destDisplay = VV.trip.destinationName || (VV.trip.destinationLat != null ? `${VV.trip.destinationLat.toFixed(4)}, ${VV.trip.destinationLon.toFixed(4)}` : 'Not set');

    let mapsButton = '';
    if (hasOrigin && hasDest) {
      const originParam = (VV.trip.originLat != null && VV.trip.originLon != null)
        ? `${VV.trip.originLat},${VV.trip.originLon}`
        : encodeURIComponent(VV.trip.originName);

      const destParam = (VV.trip.destinationLat != null && VV.trip.destinationLon != null)
        ? `${VV.trip.destinationLat},${VV.trip.destinationLon}`
        : encodeURIComponent(VV.trip.destinationName);

      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`;
      mapsButton = `
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-amber btn-full mt-3">
          🗺️ Open Route in Google Maps
        </a>
      `;
    }

    const departureInfo = [];
    if (VV.trip.departureDate) departureInfo.push(`📅 ${VV.trip.departureDate}`);
    if (VV.trip.departureTime) departureInfo.push(`⏰ ${VV.trip.departureTime}`);
    const departureStr = departureInfo.length > 0 ? departureInfo.join(' · ') : 'Departure time not specified';

    summarySec.innerHTML = `
      <div class="trip-summary animate-in">
        <div class="card-header-left mb-2">
          <span class="card-icon" aria-hidden="true">🚗</span>
          <span class="card-title">Trip Route Overview</span>
        </div>
        <div class="trip-route">
          <div class="trip-point">
            <div class="trip-point-label">From</div>
            <div class="trip-point-name">${esc(originDisplay)}</div>
          </div>
          <div class="trip-arrow" aria-hidden="true">➔</div>
          <div class="trip-point">
            <div class="trip-point-label">To</div>
            <div class="trip-point-name">${esc(destDisplay)}</div>
          </div>
        </div>
        <div class="trip-meta">
          <span>${esc(departureStr)}</span>
          <span class="badge badge-indigo">Driving</span>
        </div>
        ${mapsButton}
      </div>
    `;
  }

  function setupGeocodeInput(inputId, resultsId, coordsId, type) {
    const input = document.getElementById(inputId);
    const resultsContainer = document.getElementById(resultsId);
    const coordsDisplay = document.getElementById(coordsId);
    if (!input || !resultsContainer || !coordsDisplay) return;

    let debounceTimer = null;

    input.addEventListener('input', () => {
      const query = input.value.trim();
      clearTimeout(debounceTimer);

      if (query.length < 2) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('open');
        input.setAttribute('aria-expanded', 'false');
        return;
      }

      debounceTimer = setTimeout(async () => {
        resultsContainer.innerHTML = '<div class="geocode-no-results"><div class="spinner spinner-sm"></div> Searching locations...</div>';
        resultsContainer.classList.add('open');
        input.setAttribute('aria-expanded', 'true');

        const { data, error } = await apiGet(`/api/geocode?q=${encodeURIComponent(query)}&count=5`);
        if (error || !data || !Array.isArray(data.results) || data.results.length === 0) {
          resultsContainer.innerHTML = '<div class="geocode-no-results">No matching locations found.</div>';
          return;
        }

        // Show all results in dropdown — NEVER auto-select when multiple results
        resultsContainer.innerHTML = data.results.map((item, index) => {
          const sub = [item.admin1, item.country].filter(Boolean).join(', ');
          return `
            <div
              class="geocode-option"
              role="option"
              tabindex="0"
              data-index="${index}"
              data-name="${esc(item.name)}"
              data-sub="${esc(sub)}"
              data-lat="${item.latitude}"
              data-lon="${item.longitude}"
              data-tz="${esc(item.timezone || 'auto')}"
            >
              <div class="geocode-option-name">${esc(item.name)}</div>
              ${sub ? `<div class="geocode-option-sub">${esc(sub)}</div>` : ''}
            </div>
          `;
        }).join('');

        // Wire click & enter selection on each result
        const options = resultsContainer.querySelectorAll('.geocode-option');
        options.forEach(opt => {
          const selectThis = () => {
            const name = opt.dataset.name;
            const sub = opt.dataset.sub;
            const lat = parseFloat(opt.dataset.lat);
            const lon = parseFloat(opt.dataset.lon);
            const tz = opt.dataset.tz;
            const fullName = sub ? `${name}, ${sub}` : name;

            input.value = fullName;
            if (type === 'origin') {
              VV.trip.originName = fullName;
              VV.trip.originLat = lat;
              VV.trip.originLon = lon;
            } else {
              VV.trip.destinationName = fullName;
              VV.trip.destinationLat = lat;
              VV.trip.destinationLon = lon;
              VV.trip.destinationTimezone = tz || 'auto';
            }

            VV.saveTrip();
            coordsDisplay.textContent = formatCoords(lat, lon);
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('open');
            input.setAttribute('aria-expanded', 'false');
            renderTripSummary();
          };

          opt.addEventListener('click', selectThis);
          opt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectThis();
            }
          });
        });
      }, 400);
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.classList.remove('open');
        input.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function setupGeolocation() {
    const locateBtn = document.getElementById('locate-btn');
    const originInput = document.getElementById('origin-input');
    const originCoords = document.getElementById('origin-coords');
    if (!locateBtn || !originInput || !originCoords) return;

    locateBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        originCoords.textContent = 'Geolocation is not supported by your browser.';
        return;
      }

      locateBtn.disabled = true;
      originCoords.innerHTML = '<span class="spinner spinner-sm"></span> Locating current GPS position...';

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          locateBtn.disabled = false;
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          VV.trip.originLat = lat;
          VV.trip.originLon = lon;

          // Attempt reverse lookup via /api/geocode?q=lat,lon
          const query = `${lat.toFixed(4)},${lon.toFixed(4)}`;
          const { data } = await apiGet(`/api/geocode?q=${encodeURIComponent(query)}&count=1`);

          let locationName = '';
          if (data && Array.isArray(data.results) && data.results.length > 0) {
            const r = data.results[0];
            const parts = [r.name, r.admin1, r.country].filter(Boolean);
            locationName = parts.join(', ');
          }

          if (!locationName) {
            locationName = `Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
          }

          originInput.value = locationName;
          VV.trip.originName = locationName;
          VV.saveTrip();

          originCoords.textContent = formatCoords(lat, lon);
          renderTripSummary();
        },
        (error) => {
          locateBtn.disabled = false;
          let message = 'Could not retrieve location. Please type your starting point.';
          if (error.code === 1) { // PERMISSION_DENIED
            message = 'Location access denied. Please type your starting point.';
          } else if (error.code === 2) { // POSITION_UNAVAILABLE
            message = 'Location unavailable. Please type your starting point.';
          } else if (error.code === 3) { // TIMEOUT
            message = 'Location request timed out. Please try again or type starting point.';
          }
          originCoords.textContent = message;
        },
        { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
      );
    });
  }

  function setupDateAndTime() {
    const departDateInput = document.getElementById('depart-date');
    const departTimeInput = document.getElementById('depart-time');

    if (departDateInput) {
      departDateInput.addEventListener('change', () => {
        VV.trip.departureDate = departDateInput.value;
        VV.saveTrip();
        renderTripSummary();
      });
    }

    if (departTimeInput) {
      departTimeInput.addEventListener('change', () => {
        VV.trip.departureTime = departTimeInput.value;
        VV.saveTrip();
        renderTripSummary();
      });
    }
  }

  function init() {
    setupGeocodeInput('origin-input', 'origin-results', 'origin-coords', 'origin');
    setupGeocodeInput('dest-input', 'dest-results', 'dest-coords', 'destination');
    setupGeolocation();
    setupDateAndTime();
    renderTripSummary();
  }

  return {
    render,
    init,
  };
})();

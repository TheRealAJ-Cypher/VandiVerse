'use strict';

/** VandiVerse SOS & Roadside Help. This page opens phone links; it does not dispatch help automatically. */
pages['sos'] = (function () {
  let locationUrl = '';
  let locationText = '';

  function render() {
    return `
      <section class="sos-page">
        <div class="sos-hero card">
          <div class="sos-hero-icon" aria-hidden="true">🆘</div>
          <p class="eyebrow">EMERGENCY SUPPORT</p>
          <h2>Need help on the road?</h2>
          <p class="sos-lead">Choose the right contact. Calls are made from your phone; VandiVerse does not automatically dispatch emergency services.</p>
          <a class="btn sos-call-emergency btn-full" href="tel:112" aria-label="Call India's emergency number 112">📞 Call Emergency Services · 112</a>
          <p class="sos-small">For immediate danger, injury, fire, or threat to life. India’s unified emergency number.</p>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-header-left"><span class="card-icon">🚙</span><div><h3 class="card-title">Renault Assist</h3><p class="card-subtitle">For your Renault Kiger breakdown</p></div></div>
          </div>
          <div class="sos-number">1800 315 4444</div>
          <a class="btn btn-amber btn-full" href="tel:18003154444">📞 Call Renault Assist</a>
          <p class="sos-small">Press 1 for roadside assistance if that option is still offered by the phone menu. Menu options can change. Confirm your vehicle’s RSA eligibility and coverage with Renault.</p>
          <div class="sos-service-list">
            <div><span>🪝</span><p><strong>Towing</strong><br><span>To an authorised Renault dealer, subject to terms.</span></p></div>
            <div><span>🚕</span><p><strong>Cab assistance</strong><br><span>Renault lists cab assistance up to 50 km, subject to terms.</span></p></div>
            <div><span>🔋</span><p><strong>Battery & tyre</strong><br><span>Jump-start and spare-wheel tyre change assistance; parts/consumables may cost extra.</span></p></div>
            <div><span>⛽</span><p><strong>Emergency fuel</strong><br><span>Renault lists emergency fuel assistance up to 5 litres; fuel is chargeable and terms apply.</span></p></div>
            <div><span>🔑</span><p><strong>Keys & minor repairs</strong><br><span>Phone troubleshooting and eligible roadside support.</span></p></div>
          </div>
          <a class="sos-source-link" href="https://www.renault.co.in/renault-service/renault-assist.html" target="_blank" rel="noopener noreferrer">Check official Renault Assist details ↗</a>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-header-left"><span class="card-icon">🛣️</span><div><h3 class="card-title">National Highway assistance</h3><p class="card-subtitle">For incidents on National Highways</p></div></div></div>
          <div class="sos-number">1033</div>
          <a class="btn btn-primary btn-full" href="tel:1033">📞 Call Highway Helpline · 1033</a>
          <p class="sos-small">24×7 assistance for National Highway users, including breakdowns and highway incidents. Coverage and response depend on location and road.</p>
          <a class="sos-source-link" href="https://ihmcl.co.in/24x7-national-highways-helpline-1033-page/" target="_blank" rel="noopener noreferrer">Official helpline information ↗</a>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-header-left"><span class="card-icon">📍</span><div><h3 class="card-title">Share your location</h3><p class="card-subtitle">Only requested when you tap below</p></div></div></div>
          <p class="sos-small">If safe to do so, get your current coordinates and share the map link with your family or the assistance operator. Location access requires browser permission and may be unavailable indoors or in poor signal.</p>
          <button type="button" id="sos-locate-btn" class="btn btn-ghost btn-full">📍 Get my current location</button>
          <div id="sos-location-result" class="sos-location-result" aria-live="polite"></div>
          <div id="sos-location-actions" class="sos-location-actions" hidden>
            <button type="button" id="sos-share-btn" class="btn btn-primary">Share location</button>
            <button type="button" id="sos-copy-btn" class="btn btn-ghost">Copy map link</button>
            <a id="sos-map-link" class="btn btn-ghost" href="#" target="_blank" rel="noopener noreferrer">Open map</a>
          </div>
        </div>

        <div class="card sos-rain-card">
          <div class="card-header"><div class="card-header-left"><span class="card-icon">🌧️</span><div><h3 class="card-title">Heavy rain or waterlogging?</h3><p class="card-subtitle">Tamil Nadu monsoon travel reminders</p></div></div></div>
          <ul class="sos-safety-list">
            <li><strong>Never drive through floodwater.</strong> Turn around and seek official guidance.</li>
            <li>If stranded, switch on hazard lights when safe, stay clear of moving traffic, and call for help.</li>
            <li>Do not stand behind or beside a vehicle stopped in a live lane. Move to a protected place only if safe.</li>
            <li>Do not touch fallen electrical wires or flooded electrical equipment.</li>
            <li>Follow official IMD, Tamil Nadu disaster-management, police and highway instructions. A weather forecast is not proof that a road is safe.</li>
          </ul>
        </div>
        <p class="sos-disclaimer">VandiVerse is a planning aid, not an emergency dispatch service. If there is immediate danger, call 112. Do not operate this app while driving; ask a passenger or stop somewhere safe.</p>
      </section>`;
  }

  function init() {
    const locateBtn = document.getElementById('sos-locate-btn');
    const result = document.getElementById('sos-location-result');
    const actions = document.getElementById('sos-location-actions');
    const mapLink = document.getElementById('sos-map-link');
    const shareBtn = document.getElementById('sos-share-btn');
    const copyBtn = document.getElementById('sos-copy-btn');

    locateBtn?.addEventListener('click', () => {
      if (!navigator.geolocation) {
        result.textContent = 'Location is not supported by this browser. You can open Maps and share your location manually.';
        return;
      }
      locateBtn.disabled = true;
      result.textContent = 'Requesting location permission…';
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        locationUrl = `https://maps.google.com/?q=${encodeURIComponent(`${lat},${lon}`)}`;
        locationText = `My current location: ${lat.toFixed(6)}, ${lon.toFixed(6)}\nMap: ${locationUrl}`;
        result.textContent = `Location ready: ${lat.toFixed(5)}, ${lon.toFixed(5)}. Accuracy approximately ${Math.round(position.coords.accuracy)} metres. Share it with your family or the operator.`;
        mapLink.href = locationUrl;
        actions.hidden = false;
        locateBtn.disabled = false;
      }, (error) => {
        const messages = {
          1: 'Location permission was denied. You can enable it in browser settings or share your location manually in Maps.',
          2: 'Your location is unavailable. Try moving to a place with better GPS reception or use Maps manually.',
          3: 'Location request timed out. Please try again when safe.'
        };
        result.textContent = messages[error.code] || 'Could not get your location. Share it manually through Maps.';
        locateBtn.disabled = false;
      }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
    });

    shareBtn?.addEventListener('click', async () => {
      if (!locationUrl) return;
      try {
        if (navigator.share) await navigator.share({ title: 'My location for roadside assistance', text: locationText, url: locationUrl });
        else {
          await navigator.clipboard.writeText(locationText);
          result.textContent = 'Location details copied. Paste them into a message to your family or assistance operator.';
        }
      } catch (error) {
        if (error.name !== 'AbortError') result.textContent = 'Sharing was not available. Use Copy map link instead.';
      }
    });

    copyBtn?.addEventListener('click', async () => {
      if (!locationUrl) return;
      try {
        await navigator.clipboard.writeText(locationText);
        result.textContent = 'Location details copied. Paste them into a message to your family or assistance operator.';
      } catch (_) {
        result.textContent = `Copy this map link manually: ${locationUrl}`;
      }
    });
  }

  return { render, init };
})();

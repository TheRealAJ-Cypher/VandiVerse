'use strict';

/**
 * VandiVerse — Weather Forecast Page
 */
pages['weather'] = (function () {
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function weatherEmoji(code) {
    const c = Number(code);
    if (c === 0) return '☀️';
    if (c === 1) return '🌤️';
    if (c === 2) return '⛅';
    if (c === 3) return '☁️';
    if (c <= 48) return '🌫️';
    if (c <= 55) return '🌦️';
    if (c <= 65) return '🌧️';
    if (c <= 67) return '🌨️';
    if (c <= 77) return '❄️';
    if (c <= 82) return '🌧️';
    if (c <= 86) return '🌨️';
    if (c <= 99) return '⛈️';
    return '❓';
  }

  function formatDayShort(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[d.getDay()] || dateStr;
    } catch (_) {
      return dateStr;
    }
  }

  function render() {
    const destLat = VV.trip.destinationLat;
    const destLon = VV.trip.destinationLon;
    const destName = VV.trip.destinationName;

    if (destLat == null || destLon == null) {
      return `
        <div class="empty-state animate-in">
          <div class="empty-state-icon" aria-hidden="true">🗺️</div>
          <h2 class="empty-state-title">No Destination Set</h2>
          <p class="empty-state-text">
            Please select a destination on the Trip setup page first so we can fetch accurate road and arrival weather.
          </p>
          <button type="button" class="btn btn-primary" onclick="navigate('trip')">
            Go to Trip Setup
          </button>
        </div>
      `;
    }

    return `
      <section class="weather-page animate-in">
        <div class="card mb-3">
          <div class="card-header mb-1">
            <div class="card-header-left">
              <span class="card-icon" aria-hidden="true">📍</span>
              <div>
                <h2 class="card-title">Destination Forecast</h2>
                <p class="card-subtitle">${esc(destName || `${destLat.toFixed(4)}, ${destLon.toFixed(4)}`)}</p>
              </div>
            </div>
            <span class="badge badge-indigo">Live Forecast</span>
          </div>
        </div>

        <button type="button" id="fetch-weather-btn" class="btn btn-primary btn-full mb-3">
          🌤️ Get Weather Forecast
        </button>

        <div id="weather-content" aria-live="polite"></div>

        <div class="weather-disclaimer">
          ⚠️ <strong>Safety Notice:</strong> Forecasts are estimates only and do not confirm road safety. Check official state highway patrols and national meteorological agencies before driving. Never drive through flooded roads — turn around, don't drown.
        </div>
      </section>
    `;
  }

  async function fetchWeather() {
    const btn = document.getElementById('fetch-weather-btn');
    const container = document.getElementById('weather-content');
    if (!btn || !container) return;

    const lat = VV.trip.destinationLat;
    const lon = VV.trip.destinationLon;
    const tz = VV.trip.destinationTimezone || 'auto';

    if (lat == null || lon == null) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Loading Forecast...';
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Retrieving high-resolution forecast from Open-Meteo...</span>
      </div>
    `;

    const url = `/api/weather?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&timezone=${encodeURIComponent(tz)}`;
    const { data, error } = await apiGet(url);

    btn.disabled = false;
    btn.innerHTML = '🌤️ Refresh Weather Forecast';

    if (error || !data) {
      container.innerHTML = `
        <div class="error-msg">
          <strong>Weather Forecast Unavailable:</strong> ${esc(error || 'Failed to retrieve data.')}
        </div>
      `;
      return;
    }

    renderWeather(data);
  }

  function renderWeather(data) {
    const container = document.getElementById('weather-content');
    if (!container) return;

    const current = data.current || {};
    const daily = Array.isArray(data.daily) ? data.daily : [];
    const hourlyToday = Array.isArray(data.hourly_today) ? data.hourly_today : [];

    // Format fetched_at time safely
    let fetchedStr = '';
    if (data.fetched_at) {
      try {
        fetchedStr = new Date(data.fetched_at).toUTCString();
      } catch (_) {
        fetchedStr = data.fetched_at;
      }
    }

    // 1. Data Source Note
    const sourceHtml = `
      <div class="data-source">
        Data fetched: ${esc(fetchedStr || 'Just now')} · Timezone: ${esc(data.forecast_timezone || 'UTC')} · Source: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
      </div>
    `;

    // 2. Current Conditions Card
    const currentCode = current.weather_code ?? 0;
    const currentEmoji = weatherEmoji(currentCode);
    const currentTemp = current.temperature != null ? `${Math.round(current.temperature)}°C` : '--°C';
    const dayNight = current.is_day === 0 ? '🌙 Night' : '☀️ Daytime';
    const windSpeed = current.windspeed != null ? `${current.windspeed} km/h` : 'Calm';
    const validTime = current.time ? current.time.replace('T', ' ') : 'Now';

    const currentCardHtml = `
      <div class="weather-current">
        <div class="current-icon" aria-hidden="true">${currentEmoji}</div>
        <div class="current-temp">${esc(currentTemp)}</div>
        <div class="current-desc">${esc(current.description || 'Current Conditions')}</div>
        <div class="current-meta-row">
          <span class="current-meta-item">💨 Wind: ${esc(windSpeed)}</span>
          <span class="current-meta-item">${dayNight}</span>
          <span class="current-meta-item">🕒 Valid: ${esc(validTime)}</span>
        </div>
      </div>
    `;

    // 3. 7-Day Forecast Strip
    let dailyHtml = '';
    if (daily.length > 0) {
      const dailyCards = daily.map((day, idx) => {
        const dayLabel = idx === 0 ? 'Today' : formatDayShort(day.date);
        const icon = weatherEmoji(day.weather_code);
        const maxT = day.temp_max != null ? Math.round(day.temp_max) : '--';
        const minT = day.temp_min != null ? Math.round(day.temp_min) : '--';
        const rainProb = day.precipitation_probability_max != null ? `${Math.round(day.precipitation_probability_max)}%` : null;

        return `
          <div class="daily-card" tabindex="0">
            <div class="daily-day">${esc(dayLabel)}</div>
            <div class="daily-icon" aria-hidden="true">${icon}</div>
            <div class="daily-temp">${maxT}° <span class="daily-temp-min">${minT}°</span></div>
            ${rainProb ? `<div class="daily-rain">💧 ${esc(rainProb)}</div>` : ''}
          </div>
        `;
      }).join('');

      dailyHtml = `
        <div class="card">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-icon" aria-hidden="true">📅</span>
              <h3 class="card-title">7-Day Trip Forecast</h3>
            </div>
            <span class="card-subtitle">Scroll for more</span>
          </div>
          <div class="daily-strip">
            ${dailyCards}
          </div>
        </div>
      `;
    }

    // 4. Hourly Forecast Chart (Pure CSS div bars)
    let hourlyHtml = '';
    if (hourlyToday.length > 0) {
      const temps = hourlyToday.map(h => typeof h.temperature === 'number' ? h.temperature : 0);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      const tempRange = (maxTemp - minTemp) || 1;

      const bars = hourlyToday.map(h => {
        const t = typeof h.temperature === 'number' ? h.temperature : 0;
        // Map temp to height ~10px - 65px
        const barHeight = Math.max(10, Math.min(65, Math.round(10 + ((t - minTemp) / tempRange) * 55)));
        
        // Rain probability bar (0-16px)
        const rainPct = typeof h.precipitation_probability === 'number' ? Math.max(0, Math.min(100, h.precipitation_probability)) : 0;
        const rainHeight = Math.max(2, Math.round((rainPct / 100) * 16));

        // Time format
        let timeLabel = h.time || '';
        if (timeLabel.includes('T')) {
          timeLabel = timeLabel.split('T')[1].slice(0, 5);
        }

        return `
          <div class="hourly-bar-wrap" title="${esc(timeLabel)}: ${Math.round(t)}°C, Rain: ${rainPct}%">
            <div class="hourly-bar-temp">${Math.round(t)}°</div>
            <div class="hourly-bar" style="height:${barHeight}px;"></div>
            <div class="hourly-bar-rain" style="height:${rainHeight}px;" title="Precipitation ${rainPct}%"></div>
            <div class="hourly-bar-time">${esc(timeLabel)}</div>
          </div>
        `;
      }).join('');

      hourlyHtml = `
        <div class="card">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-icon" aria-hidden="true">📊</span>
              <div>
                <h3 class="card-title">Today's Hourly Temperature & Rain</h3>
                <p class="card-subtitle">Bars: Temperature (top) & Rain probability (bottom)</p>
              </div>
            </div>
          </div>
          <div class="hourly-bars">
            ${bars}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="animate-in">
        ${sourceHtml}
        ${currentCardHtml}
        ${dailyHtml}
        ${hourlyHtml}
      </div>
    `;
  }

  function init() {
    const fetchBtn = document.getElementById('fetch-weather-btn');
    if (fetchBtn) {
      fetchBtn.addEventListener('click', fetchWeather);
    }
  }

  return {
    render,
    init,
  };
})();

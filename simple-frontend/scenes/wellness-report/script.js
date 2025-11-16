class WellnessReportScene {
  constructor() {
    this.config = {};
    this.resultsEl = document.getElementById('results');
    this.statusEl = document.getElementById('status');
    this.sessionInput = document.getElementById('session-input');
    document.getElementById('fetch-btn').addEventListener('click', () => this.fetchSession());
    document.getElementById('latest-btn').addEventListener('click', () => this.fetchLatest());
  }
  init(config) {
    this.config = config || {};
    if (this.config.sessionId) {
      this.sessionInput.value = this.config.sessionId;
      this.fetchSession();
    } else {
      // autoLatest flag is treated same as default
      this.fetchLatest();
    }
  }
  setStatus(text) { this.statusEl.textContent = text; }
  async fetchSession() {
    const sessionId = this.sessionInput.value.trim();
    if (!sessionId) {
      this.setStatus('No session id provided.');
      return;
    }
    this.setStatus('Fetching session ' + sessionId + ' ...');
    try {
      const res = await fetch(`/api/wellness/session/${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      if (!data.success) {
        this.renderEmpty('No wellness result found for that session.');
        this.setStatus('Not found.');
        return;
      }
      this.renderCards([data.data]);
      this.setStatus('Loaded session result.');
    } catch (e) {
      this.setStatus('Error fetching session.');
    }
  }
  async fetchLatest() {
    this.setStatus('Fetching latest per session...');
    try {
      const res = await fetch('/api/wellness/latest');
      const data = await res.json();
      if (!data.success || data.count === 0) {
        this.renderEmpty('No wellness data yet.');
        this.setStatus('Empty.');
        return;
      }
      this.renderCards(data.data);
      this.setStatus('Loaded ' + data.count + ' sessions.');
    } catch (e) {
      this.setStatus('Error fetching latest.');
    }
  }
  renderEmpty(msg) {
    this.resultsEl.innerHTML = `<div class="empty">${msg}</div>`;
  }
  renderCards(rows) {
    this.resultsEl.innerHTML = rows.map(r => this.cardHtml(r)).join('');
  }
  cardHtml(r) {
    const parsed = this.parseWellness(r.wellness);
    return `<div class="card">
      <h3>Session ${this.escape(r.session_id)}</h3>
      <div class="meta">Timestamp: ${this.escape(r.sensor_timestamp)}</div>
      <div class="wellness-section">
        <div class="wellness-item wellness-summary">
          <span class="wellness-key">Summary:</span>${this.escape(parsed.summary || 'N/A')}
        </div>
        <div class="wellness-item">
          <span class="wellness-key">Thermal Comfort:</span>${this.escape(parsed.thermalComfort || 'N/A')}
        </div>
        <div class="wellness-item">
          <span class="wellness-key">Temperature:</span>${this.escape(parsed.temperature || 'N/A')}
        </div>
        <div class="wellness-item">
          <span class="wellness-key">Humidity:</span>${this.escape(parsed.humidity || 'N/A')}
        </div>
      </div>
    </div>`;
  }
  parseWellness(wellness) {
    if (wellness == null) return {};
    const str = String(wellness);
    // Try JSON first
    try {
      const obj = JSON.parse(str);
      const get = (...keys) => {
        for (const k of keys) {
          if (k in obj) return obj[k];
          // case-insensitive scan
          const hit = Object.keys(obj).find(ok => ok.toLowerCase() === k.toLowerCase());
          if (hit) return obj[hit];
        }
        return undefined;
      };
      return {
        summary: get('summary', 'overall_summary', 'report', 'main'),
        thermalComfort: get('thermalComfort', 'thermal_comfort', 'comfort', 'thermal'),
        temperature: get('temperature', 'temp', 'ambient_temperature'),
        humidity: get('humidity', 'hum', 'relative_humidity')
      };
    } catch (_) {}
    // Plain text parsing
    const grabBlock = (head) => {
      const re = new RegExp(head + ':\\s*([\\s\\S]*?)(?:\\n[A-Z][A-Za-z ]+:|$)');
      const m = str.match(re);
      return m ? m[1].trim() : undefined;
    };
    const firstLine = str.split('\n')[0];
    const summary = grabBlock('Summary') || firstLine;
    const thermalComfort = (str.match(/Thermal Comfort:\s*(.*)/i) || [])[1];
    const temperature = (str.match(/Temperature:\s*([0-9.+-]+°?C?)/i) || [])[1];
    const humidity = (str.match(/Humidity:\s*([0-9.+-]+%)/i) || [])[1];
    return { summary, thermalComfort, temperature, humidity };
  }
  escape(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[s]));
  }
}

const scene = new WellnessReportScene();

window.addEventListener('message', (event) => {
  if (event.data.type === 'SCENE_CONFIG') {
    scene.init(event.data.config);
  }
});

// Standalone default
if (window === window.parent) {
  scene.init({});
}

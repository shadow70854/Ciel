(() => {
  'use strict';

  const worker = 'https://flat-haze-89de.andrekonnerth59.workers.dev';
  const key = 'ciel.reminders.v1';
  let state = null;
  try {
    const config = JSON.parse(localStorage.getItem(key));
    if (config?.code && /^[a-f0-9]{32}$/.test(config.id) && /^[a-f0-9]{64}$/.test(config.token)) state = config;
  } catch {}
  let message = '';
  let busy = false;
  const dirtyKey = key + '.pending';
  let pending = false;
  try { pending = localStorage.getItem(dirtyKey) === 'yes'; } catch {}
  let timer;

  function store(next) {
    if (next) localStorage.setItem(key, JSON.stringify(next));
    else localStorage.removeItem(key);
    state = next;
  }

  function randomHex(n) {
    return Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, '0')).join('');
  }

  async function api(path, config, method = 'GET', body) {
    const headers = { Authorization: 'Bearer ' + config.code };
    if (config.token) headers['X-Device-Token'] = config.token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(worker + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 503) throw Error('Der Cloudflare-Dienst ist noch nicht eingerichtet. Prüfe die Datenbank DB und das Secret API_ACCESS_KEY.');
      throw Error(result.error || 'Der Erinnerungsdienst ist gerade nicht erreichbar.');
    }
    return result;
  }

  function slots(rows, now = Date.now()) {
    const reminders = [];
    for (const row of rows) {
      const date = new Date(row.date);
      if (!Number.isFinite(+date)) continue;
      const offsets = row.mode === 'daily' ? [7, 6, 5, 4, 3, 2, 1, 0] : row.mode === 'day' ? [1, 0] : [0];
      for (const days of offsets) {
        const due = new Date(date);
        due.setDate(due.getDate() - days);
        if (+due <= now) continue;
        const when = date.toLocaleString('de-DE', {dateStyle: 'short', timeStyle: 'short'});
        reminders.push({
          id: row.id + '-' + days + '-' + (+due),
          due: +due,
          title: days ? 'Ciel · Terminerinnerung' : 'Ciel · Jetzt ist dein Termin',
          body: (row.title + ' · ' + when).slice(0, 280),
        });
      }
    }
    if (reminders.length > 400) throw Error('Mehr als 400 Erinnerungen. Wähle bei einigen Terminen weniger Vorab-Erinnerungen.');
    return reminders;
  }

  function show(text) {
    message = text;
    const status = document.querySelector('#reminder-status');
    if (status) status.textContent = text;
  }

  function markPending(value) {
    pending = value;
    try {
      if (value) localStorage.setItem(dirtyKey, 'yes');
      else localStorage.removeItem(dirtyKey);
    } catch {}
  }

  async function sync() {
    if (!state?.active || busy) return;
    const config = state;
    busy = true;
    try {
      do {
        pending = false;
        const reminders = slots(data.appointments);
        show('Erinnerungen werden geplant …');
        await api('/sync', config, 'POST', {id: config.id, reminders});
        if (!pending) markPending(false);
        show(reminders.length ? reminders.length + ' Erinnerungen geplant.' : 'Mitteilungen sind verbunden. Keine Erinnerungen fällig.');
      } while (pending);
    } catch (error) {
      markPending(true);
      show('Erinnerungen nicht aktualisiert. ' + error.message + ' Tippe auf „Erneut planen“.');
    } finally {
      busy = false;
    }
  }

  function queue() {
    if (!state?.active) return;
    markPending(true);
    show('Änderungen für die Erinnerungen werden gespeichert …');
    clearTimeout(timer);
    timer = setTimeout(sync, 150);
  }

  async function activate(code) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      throw Error('Öffne Ciel in Safari, füge es zum Home-Bildschirm hinzu und starte es über das Ciel-Symbol.');
    }
    if (!/^[!-~]{20,}$/.test(code)) throw Error('Gib deinen Zugangscode aus Cloudflare ein (mindestens 20 Zeichen, ohne Leerzeichen oder Umlaute).');
    // Request permission directly in the tap handler, before doing any network work.
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission !== 'granted') throw Error('Erlaube Mitteilungen für Ciel in den Einstellungen deines Geräts.');
    const config = { id: state?.id || randomHex(16), token: state?.token || randomHex(32), code, active: false };
    const {publicKey} = await api('/config', config);
    const encoded = publicKey.replace(/-/g, '+').replace(/_/g, '/');
    const applicationServerKey = Uint8Array.from(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')), c => c.charCodeAt(0));
    await navigator.serviceWorker.register('./sw.js', {scope: './'});
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const oldKey = new Uint8Array(subscription.options.applicationServerKey || []);
      if (oldKey.length !== applicationServerKey.length || oldKey.some((x, i) => x !== applicationServerKey[i])) {
        await subscription.unsubscribe();
        subscription = null;
      }
    }
    subscription ||= await registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey});
    store(config);
    await api('/register', config, 'POST', {id: config.id, subscription: subscription.toJSON()});
    markPending(true);
    store({...config, active: true});
  }

  const saveLocal = save;
  save = function(next) {
    const changed = next.appointments !== data.appointments;
    const ok = saveLocal(next);
    if (ok && changed) queue();
    return ok;
  };

  window.renderReminders = function() {
    if (tab !== 'termine') return;
    const active = state?.active;
    document.querySelector('#appointment').insertAdjacentHTML('afterend',
      `<div class="card"><h3>Mitteilungen für deine Termine</h3>
      ${active ? '<p>Neue und bestehende Termine werden automatisch für Erinnerungen eingeplant.</p><div class="actions"><button id="reminder-test">Test senden</button><button id="reminder-sync">Erneut planen</button><button id="reminder-off">Ausschalten</button></div>' :
      '<p>Öffne Ciel auf dem iPhone über das Symbol am Home-Bildschirm. Aktiviere hier einmal die Mitteilungen. Danach plant Ciel die Erinnerungen automatisch.</p><label>Zugangscode für Mitteilungen<input id="reminder-code" type="password" autocomplete="off" placeholder="Dein Cloudflare-Zugangscode"></label><button class="primary" id="reminder-on">Mitteilungen aktivieren</button>'}
      <p id="reminder-status" role="status"></p></div>`);
    show(message || (active ? (pending ? 'Erinnerungen müssen noch aktualisiert werden.' : 'Mitteilungen sind verbunden.') : 'Mitteilungen sind noch aus.'));
  };

  document.addEventListener('click', async event => {
    const id = event.target.closest('button')?.id;
    if (!['reminder-on','reminder-sync','reminder-test','reminder-off'].includes(id)) return;
    if (busy) return;
    if (id === 'reminder-sync') return sync();
    if (id === 'reminder-off' && !confirm('Mitteilungen und geplante Erinnerungen für dieses Gerät ausschalten?')) return;
    busy = true;
    let plan = false;
    try {
      if (id === 'reminder-on') {
        const code = document.querySelector('#reminder-code').value.trim();
        show('Mitteilungen werden eingerichtet …');
        await activate(code);
        plan = true;
        render();
      } else if (id === 'reminder-test') {
        show('Test wird gesendet …');
        await api('/test', state, 'POST', {id: state.id});
        show('Test gesendet. Schau in die Mitteilungszentrale deines iPhones.');
      } else {
        // Keep local state until the server confirms it removed all planned pushes.
        await api('/device', state, 'DELETE', {id: state.id});
        store(null);
        markPending(false);
        show('Mitteilungen sind ausgeschaltet.');
        render();
      }
    } catch (error) {
      show(error.message);
    } finally {
      busy = false;
      if (plan || (pending && state?.active)) sync();
    }
  });

  window.addEventListener('online', () => { if (pending) sync(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && pending) sync(); });
  if (tab === 'termine') render();
  if (pending && state?.active) sync();
})();

// Admin dashboard — email-gated, pulls viewer list from SQLite via /api/subscribers.
const FI_ADMIN_EMAIL = "abcd@gmail.com";

function parseDevice(ua) {
  if (!ua) return '—';
  const mobile = /Mobile|Android|iPhone|iPad/.test(ua);
  let browser = 'Browser';
  if (/Edg\//.test(ua))        browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua))browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  const device = mobile
    ? (/iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : 'Android')
    : 'Desktop';
  return `${browser} · ${device}`;
}

function StatCard({ value, label }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-label">{label}</div>
    </div>
  );
}

function AdminPage({ onExit }) {
  const [authed, setAuthed] = React.useState(
    sessionStorage.getItem('fi_admin') === 'ok'
  );
  const [emailInput, setEmailInput] = React.useState('');
  const [err, setErr] = React.useState(false);

  const [list, setList]       = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [fetchErr, setFetchErr] = React.useState(false);
  const [search, setSearch]   = React.useState('');

  // Fetch from DB whenever authed.
  const loadList = React.useCallback(() => {
    setLoading(true);
    setFetchErr(false);
    fetch('/api/subscribers')
      .then(r => r.json())
      .then(data => { setList(data); setLoading(false); })
      .catch(() => { setFetchErr(true); setLoading(false); });
  }, []);

  React.useEffect(() => {
    if (authed) loadList();
  }, [authed]);

  const today   = new Date().toDateString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const todayCount = list.filter(r => r.created_at && new Date(r.created_at).toDateString() === today).length;
  const weekCount  = list.filter(r => r.created_at && new Date(r.created_at) >= weekAgo).length;
  const totalVisits = list.reduce((s, r) => s + (r.visit_count || 1), 0);

  const filtered = search
    ? list.filter(r => r.email.toLowerCase().includes(search.toLowerCase()))
    : list;

  const tryLogin = (e) => {
    e.preventDefault();
    if (emailInput.trim().toLowerCase() === FI_ADMIN_EMAIL) {
      sessionStorage.setItem('fi_admin', 'ok');
      setAuthed(true);
    } else {
      setErr(true);
    }
  };

  const loadXlsx = () => new Promise((resolve) => {
    if (window.XLSX) return resolve(window.XLSX);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload = () => resolve(window.XLSX);
    document.head.appendChild(s);
  });

  const exportExcel = () => {
    loadXlsx().then((XLSX) => {
      const headers = ['#', 'Email', 'First Seen', 'Last Seen', 'Visits', 'Device'];
      const rows = list.map((r, i) => [
        i + 1,
        r.email,
        r.created_at ? new Date(r.created_at).toLocaleString() : '—',
        r.last_seen  ? new Date(r.last_seen).toLocaleString()  : '—',
        r.visit_count || 1,
        parseDevice(r.user_agent),
      ]);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = [
        { wch: 5 }, { wch: 34 }, { wch: 22 },
        { wch: 22 }, { wch: 8 }, { wch: 22 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Viewers');
      XLSX.writeFile(wb, 'founder_insights_viewers.xlsx');
    });
  };

  const wipe = () => {
    if (!confirm('Clear all viewer data? This cannot be undone.')) return;
    localStorage.removeItem('fi_subscribers');
    localStorage.removeItem('fi_current_email');
    localStorage.removeItem('subscribed');
    setList([]);
  };

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div className="admin-wrap" data-screen-label="Admin">
        <div className="admin-login-block">
          <div className="admin-eyebrow">Founder Insights · Restricted</div>
          <h1 className="admin-title">Admin Access.</h1>
          <p className="admin-sub">Enter your admin email to continue.</p>
          <form className="admin-pw" onSubmit={tryLogin}>
            <input
              type="email"
              placeholder="your@email.com"
              value={emailInput}
              autoFocus
              onChange={(e) => { setEmailInput(e.target.value); if (err) setErr(false); }}
            />
            <button type="submit">Enter →</button>
          </form>
          {err && <div className="cover-error" style={{ marginTop: 12 }}>Access denied — wrong email.</div>}
        </div>
        <div className="admin-actions">
          <button className="chip" onClick={onExit}>← Back to issue</button>
        </div>
      </div>
    );
  }

  /* ── Dashboard screen ── */
  return (
    <div className="admin-wrap" data-screen-label="Admin">

      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">Founder Insights · Admin</div>
          <h1 className="admin-title">Viewer Dashboard.</h1>
        </div>
        <div className="admin-header-actions">
          <button className="chip" onClick={loadList} title="Refresh">↻ Refresh</button>
          <button
            className="chip chip-accent"
            onClick={exportExcel}
            disabled={!list.length}
          >
            ↓ Download Excel
          </button>
          <button className="chip" onClick={onExit}>← Back to issue</button>
        </div>
      </div>

      <div className="admin-stats">
        <StatCard value={loading ? '…' : list.length} label="Total Viewers" />
        <StatCard value={loading ? '…' : todayCount}  label="Today" />
        <StatCard value={loading ? '…' : weekCount}   label="This Week" />
        <StatCard value={loading ? '…' : totalVisits} label="Total Visits" />
      </div>

      <div className="admin-search-wrap">
        <input
          className="admin-search"
          type="text"
          placeholder="Search by email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="admin-search-count eyebrow">
          {filtered.length} of {list.length}
        </span>
      </div>

      <div className="admin-table">
        <div className="admin-table-head">
          <span>#</span>
          <span>Email</span>
          <span>First Seen</span>
          <span>Last Seen</span>
          <span>Visits</span>
          <span>Device</span>
        </div>
        <div className="admin-table-body">
          {loading && (
            <div className="admin-empty">Loading…</div>
          )}
          {fetchErr && (
            <div className="admin-empty" style={{ color: 'var(--accent)' }}>
              Could not load data — is the server running?
            </div>
          )}
          {!loading && !fetchErr && filtered.length === 0 && (
            <div className="admin-empty">
              {list.length === 0
                ? 'No viewers yet — submit an email on the cover page.'
                : 'No results match that search.'}
            </div>
          )}
          {!loading && !fetchErr && filtered.map((r, i) => (
            <div className="admin-table-row" key={r.email}>
              <span className="col-rk">{String(i + 1).padStart(3, '0')}</span>
              <span className="col-em">{r.email}</span>
              <span className="col-dt">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</span>
              <span className="col-dt">{r.last_seen  ? new Date(r.last_seen).toLocaleString()  : '—'}</span>
              <span className="col-vc">{r.visit_count || 1}</span>
              <span className="col-dv">{parseDevice(r.user_agent)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-foot-actions">
        <button className="chip chip-danger" onClick={wipe} disabled={!list.length}>
          Wipe all data
        </button>
      </div>
    </div>
  );
}

window.AdminPage = AdminPage;

// Admin route — shows captured emails. Visit with ?admin=1 in URL.
// In production: protect via env var ADMIN_PASSWORD. Here: hardcoded
// "insights" so it's testable in this prototype.

const FI_ADMIN_PASSWORD = "insights";

function AdminPage({ onExit }) {
  const [authed, setAuthed] = React.useState(
    sessionStorage.getItem('fi_admin') === 'ok'
  );
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState(false);

  const list = React.useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('fi_subscribers') || '[]');
      // Old-format strings → upgrade
      return raw.map(r => typeof r === 'string'
        ? { email: r, created_at: null, user_agent: null } : r);
    } catch (e) { return []; }
  }, [authed]);

  const tryLogin = (e) => {
    e.preventDefault();
    if (pw === FI_ADMIN_PASSWORD) {
      sessionStorage.setItem('fi_admin', 'ok');
      setAuthed(true);
    } else {
      setErr(true);
    }
  };

  const exportAll = () => {
    const rows = [['rank', 'email', 'created_at', 'user_agent'],
      ...list.map((r, i) => [i + 1, r.email, r.created_at || '', r.user_agent || ''])];
    const csv = rows.map(r => r.map(v => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'fi_subscribers.csv';
    document.body.appendChild(a); a.click(); a.remove();
  };

  const wipe = () => {
    if (!confirm('Clear all captured emails? This cannot be undone.')) return;
    localStorage.removeItem('fi_subscribers');
    location.reload();
  };

  if (!authed) {
    return (
      <div className="admin-wrap" data-screen-label="Admin">
        <h1 className="admin-title">Admin.</h1>
        <div className="admin-sub">Restricted · enter password to continue</div>
        <form className="admin-pw" onSubmit={tryLogin}>
          <input
            type="password"
            placeholder="password"
            value={pw}
            autoFocus
            onChange={(e) => { setPw(e.target.value); if (err) setErr(false); }}
          />
          <button type="submit">Unlock →</button>
        </form>
        {err && <div className="cover-error" style={{ marginTop: 10 }}>Wrong password</div>}
        <div className="smallprint" style={{ marginTop: 36 }}>
          In production, this gate would compare against an environment variable
          (<span className="mono">ADMIN_PASSWORD</span>) on the server. For this
          prototype the password is{' '}
          <span className="mono">"insights"</span>.
        </div>
        <div className="admin-actions">
          <button className="chip" onClick={onExit}>← Back to issue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrap" data-screen-label="Admin">
      <h1 className="admin-title">Captured emails.</h1>
      <div className="admin-sub">
        {list.length} subscriber{list.length === 1 ? '' : 's'} · stored locally for this demo
      </div>

      <div className="admin-list">
        {list.length === 0
          ? <div className="admin-empty">No subscribers yet. Submit one from the cover page.</div>
          : list.map((r, i) => (
            <div className="admin-list-row" key={i}>
              <span className="rk">{String(i + 1).padStart(3, '0')}</span>
              <span className="em">{r.email}</span>
              <span className="dt">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</span>
            </div>
          ))}
      </div>

      <div className="admin-actions">
        <button className="chip" onClick={exportAll} disabled={!list.length}>Export CSV</button>
        <button className="chip" onClick={wipe} disabled={!list.length}>Wipe all</button>
        <button className="chip" onClick={onExit}>← Back to issue</button>
      </div>
    </div>
  );
}

window.AdminPage = AdminPage;

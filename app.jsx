// Main app — cover ↔ issue ↔ admin + Tweaks
const FI_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showGate": "auto",
  "accent": "#D63D1F",
  "paper": "#FFFFFF"
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ['#D63D1F', '#1F2D5C', '#0E5E3D', '#1A1A1A'];
const PAPER_OPTIONS  = ['#F5F1EA', '#F2EDE0', '#EEEAE0', '#FFFFFF'];

function readRoute() {
  const qs = new URLSearchParams(location.search);
  if (qs.get('admin') === '1' || location.hash === '#admin') return 'admin';
  return null;
}

function App() {
  const [t, setTweak] = useTweaks(FI_DEFAULTS);

  const initialView = React.useMemo(() => {
    if (readRoute() === 'admin') return 'admin';
    if (t.showGate === 'never')  return 'issue';
    return 'cover';
  }, []);

  const [view, setView] = React.useState(initialView);

  // Listen to hash changes for admin route
  React.useEffect(() => {
    const onHash = () => {
      if (readRoute() === 'admin') setView('admin');
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onHash);
    };
  }, []);

  // Theme
  React.useEffect(() => {
    const root = document.documentElement;
    if (t.accent) root.style.setProperty('--accent', t.accent);
    if (t.paper)  root.style.setProperty('--paper', t.paper);
  }, [t.accent, t.paper]);

  // Flow tweak
  React.useEffect(() => {
    if (view === 'admin') return;
    if (t.showGate === 'always') setView('cover');
    else if (t.showGate === 'never') setView('issue');
  }, [t.showGate]);

  // Track each visit to the issue view.
  React.useEffect(() => {
    if (view === 'issue') trackView();
  }, [view]);

  const trackView = () => {
    const email = localStorage.getItem('fi_current_email');
    if (!email || !window.FI_DB) return;
    const now = new Date().toISOString();
    window.FI_DB.collection('subscribers').doc(email).update({
      last_seen: now,
      visit_count: firebase.firestore.FieldValue.increment(1),
    }).catch(() => {});
  };

  const handleSubmitted = () => {
    setView('issue');
    window.scrollTo({ top: 0 });
  };
  const handleReset = () => {
    try {
      localStorage.removeItem('subscribed');
    } catch (e) {}
    setView('cover');
    window.scrollTo({ top: 0 });
  };
  const exitAdmin = () => {
    history.replaceState(null, '', location.pathname);
    setView(localStorage.getItem('subscribed') === 'true' ? 'issue' : 'cover');
  };
  const gotoAdmin = () => {
    history.pushState(null, '', location.pathname + '?admin=1');
    setView('admin');
  };

  let body;
  if (view === 'admin')      body = <AdminPage key="admin" onExit={exitAdmin} />;
  else if (view === 'cover') body = <CoverPage key="cover" onSubmit={handleSubmitted} onAdmin={gotoAdmin} />;
  else                       body = <Issue     key="issue" onReset={handleReset} />;

  return (
    <>
      {body}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Flow">
          <TweakRadio
            label="Route"
            options={[
              { value: 'auto',   label: 'Auto' },
              { value: 'always', label: 'Cover' },
              { value: 'never',  label: 'Issue' },
            ]}
            value={t.showGate}
            onChange={(v) => setTweak('showGate', v)} />
          <TweakButton label="Reset subscription" onClick={handleReset} />
          <TweakButton label="Open /admin" onClick={gotoAdmin} />
        </TweakSection>
        <TweakSection label="Palette">
          <TweakColor
            label="Fire (accent)"
            options={ACCENT_OPTIONS}
            value={t.accent}
            onChange={(v) => setTweak('accent', v)} />
          <TweakColor
            label="Paper"
            options={PAPER_OPTIONS}
            value={t.paper}
            onChange={(v) => setTweak('paper', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

// Cover page — magazine-cover treatment.
const { useState: useStateCover } = React;

function CoverPage({ onSubmit, onAdmin }) {
  const [email, setEmail] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [savedFlag, setSavedFlag] = React.useState(false);

  const validate = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const submit = (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate(email)) {
      setError(true);
      return;
    }
    setError(false);
    setSubmitting(true);
    const clean = email.trim().toLowerCase();
    localStorage.setItem('fi_current_email', clean);

    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: clean, user_agent: navigator.userAgent }),
    })
      .then(r => r.json())
      .then(data => {
        setSavedFlag(!!data.ok);
        setTimeout(() => onSubmit(), 700);
      })
      .catch(() => {
        setSavedFlag(false);
        setTimeout(() => onSubmit(), 700);
      });
  };

  return (
    <div className="cover" data-screen-label="01 Cover">
      <div className="cover-top">
        <span className="mono">VOL. 01 · ISSUE 2026</span>
        <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
          <span className="mono">01 / 02</span>
          {onAdmin && (
            <button className="cover-admin-btn" onClick={onAdmin}>Admin <span className="arr">→</span></button>
          )}
        </div>
      </div>

      <div className="cover-mid">
        <h1 className="cover-headline">
          <span className="line">Who builds</span>
          <span className="line">India's</span>
          <span className="line">next-listed</span>
          <span className="line fire">companies?</span>
        </h1>
        <p className="cover-sub">
          Demographic and educational portraits of 1,450 founders behind
          481 SEBI DRHP filings, 2021 to 2026.
        </p>
      </div>

      <div className="cover-bot">
        <div className="cover-email-wrap">
          <span className="eyebrow">Read the issue</span>
          {submitting ? (
            <div className="cover-email-loading">
              {savedFlag
                ? <><span className="cover-email-tick">✓</span> Email saved. Opening the issue…</>
                : <>Saving your email…</>}
            </div>
          ) : (
            <form
              className={`cover-email-form${focused ? ' focused' : ''}${error ? ' error' : ''}`}
              onSubmit={submit}
            >
              <input
                className="cover-email-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(false); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoFocus
              />
              <button className="cover-email-btn" type="submit">
                Read the issue <span className="arr">→</span>
              </button>
            </form>
          )}
          {error && <div className="cover-error">Enter a valid email</div>}
        </div>

        <div className="cover-source">
          Source: SEBI DRHP filings.<br />
          Methodology overleaf.
        </div>
      </div>
    </div>
  );
}

window.CoverPage = CoverPage;

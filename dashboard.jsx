// Dashboard — scroll narrative across 7 sections + colophon.
// Reads aggregates from window.FI_DATA, supports live filtering via FiltersContext.

const D = window.FI_DATA;

/* ── Filters context: gender / ageRange / state ───────────────── */
const FiltersCtx = React.createContext({ filters: null, setFilters: () => {}, filtered: null });

function useFiltered() {
  return React.useContext(FiltersCtx);
}


/* ── Section primitives ───────────────────────────────────────── */
function SectionHead({ eyebrow, title, caption, action }) {
  return (
    <header className="section-head">
      <div className="section-head-row">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="section-title">{title}</h2>
        </div>
        {action}
      </div>
      {caption && <p className="section-caption">{caption}</p>}
    </header>
  );
}

function Masthead({ onMethodology, onFiltersToggle, hasFilters }) {
  const [hide, setHide] = React.useState(false);
  React.useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) { setHide(false); last = y; return; }
      setHide(y > last && y > 200);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className={`masthead${hide ? ' hide' : ''}`}>
      <div className="masthead-inner">
        <span>Founder Insights · Vol. 01</span>
        <span className="right">
          {hasFilters && <a className="filter-pin" onClick={onFiltersToggle}>● Filtered</a>}
          <a onClick={onFiltersToggle}>Filters</a>
          <a onClick={onMethodology}>Methodology</a>
        </span>
      </div>
    </div>
  );
}

function MethodologyModal({ onClose }) {
  React.useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Methodology</h2>
        <p>
          We extracted board, promoter and key-management-personnel sections
          from 480 unique companies' Draft Red Herring Prospectuses, filed
          with SEBI between March 2021 and March 2026 — 9,169 individual
          biographies in total.
        </p>
        <p style={{ marginTop: 12 }}>Founders were classified in two passes:</p>
        <p style={{ marginLeft: 16, marginTop: 4 }}>
          <b>Confirmed (906)</b> — explicitly labelled "Promoter" or "Founder"
          on the DRHP cover sheet.<br />
          <b>Likely (544)</b> — Managing Directors and Chairmen whose tenure
          and shareholding history strongly suggest founding involvement.
        </p>
        <p style={{ marginTop: 12 }}>
          Education, age, gender and hometown were parsed from biographical
          prose and validated against the SEBI report. We publish per-attribute
          coverage rates — every chart in this issue lists its denominator.
        </p>
        <p style={{ marginTop: 12 }}>
          The dataset is internally consistent: 100% of demographic aggregates
          and 100% of geographic counts reproduce the SEBI report's published
          numbers exactly. Some degree and institution counts diverge slightly
          from the report (±10%) where our parser cleaned names differently —
          the data wins; we report what the cleaned data actually contains.
        </p>
        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button className="close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Filter bar ───────────────────────────────────────────────── */
const STATE_OPTIONS = D.topStates.map(s => s.name);

function FilterBar({ open, filters, setFilters, onClose }) {
  if (!open) return null;
  const f = filters || {};
  const update = (patch) => setFilters({ ...f, ...patch });
  const clear = () => setFilters(null);
  const hasAny = !!(f.gender || f.state || f.ageMin != null || f.ageMax != null);

  return (
    <div className="filter-bar">
      <div className="filter-bar-inner">
        <span className="filter-eyebrow eyebrow">Filter the issue</span>

        <div className="filter-group">
          <label className="filter-lbl">Gender</label>
          <div className="filter-chips">
            {['All', 'Male', 'Female'].map(opt => (
              <button key={opt}
                      className={`chip${(f.gender || 'All') === opt ? ' on' : ''}`}
                      onClick={() => update({ gender: opt === 'All' ? null : opt })}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-lbl">State</label>
          <select className="filter-sel"
                  value={f.state || ''}
                  onChange={(e) => update({ state: e.target.value || null })}>
            <option value="">Any state</option>
            {STATE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-lbl">Age range</label>
          <div className="filter-age">
            <input type="number" min={20} max={95} placeholder="20"
                   value={f.ageMin ?? ''}
                   onChange={(e) => update({ ageMin: e.target.value ? +e.target.value : null })} />
            <span>–</span>
            <input type="number" min={20} max={95} placeholder="92"
                   value={f.ageMax ?? ''}
                   onChange={(e) => update({ ageMax: e.target.value ? +e.target.value : null })} />
          </div>
        </div>

        <div className="filter-actions">
          {hasAny && <button className="chip" onClick={clear}>Clear</button>}
          <button className="chip primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ── Section 01 — Opening ── */
function Sec01() {
  const { filtered } = useFiltered();
  const cells = filtered
    ? filtered.kpi
    : [
        { value: '9,169', label: 'people\nanalyzed'   },
        { value: '480',   label: 'companies\nexamined' },
        { value: '1,450', label: 'founders\nidentified' },
        { value: '51',    label: 'median\nage'         },
      ];
  return (
    <section className="section" data-screen-label="02 Opening">
      <Reveal stagger>
        <div className="grid-12">
          <div className="col-5">
            <SectionHead
              eyebrow="01 · By the numbers"
              title={filtered ? "Your filtered cohort." : "A 1,450-person portrait."}
              caption={
                filtered
                  ? "Aggregates below are recomputed from the row-level dataset using your filters."
                  : "Five years of issuance filings, one cohort of founders. The dataset spans every Draft Red Herring Prospectus filed with SEBI between March 2021 and March 2026."
              }
            />
          </div>
          <div className="col-7">
            <BignumGrid cells={cells} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Section 02 — Geography ── */
function Sec02() {
  const { filtered } = useFiltered();
  const rows = filtered ? filtered.topStates : D.topStates;
  const stateCounts = {};
  rows.forEach(s => { stateCounts[s.name] = s.value; });
  return (
    <section className="section" data-screen-label="03 Geography">
      <Reveal>
        <SectionHead
          eyebrow="02 · Geography of capital"
          title="Where India's founders come from."
          caption="Home state at the time of filing. Maharashtra and Gujarat — the western industrial belt — account for 16.3% of every founder we examined."
        />
        <div className="grid-12" style={{ marginTop: 32, alignItems: 'start' }}>
          <div className="col-7">
            <IndiaTileMap stateCounts={stateCounts} />
          </div>
          <div className="col-5">
            <TypographicRanking rows={rows} caption="Top 10 home states · founder count" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Pull quote ── */
function PullQuote({ children }) {
  return (
    <div className="pullquote-wrap">
      <Reveal>
        <blockquote className="pullquote">{children}</blockquote>
      </Reveal>
    </div>
  );
}

/* ── Section 03 — Age ── */
function Sec03() {
  const { filtered } = useFiltered();
  const buckets = filtered ? filtered.ageBuckets : D.ageBuckets;
  const median  = filtered ? filtered.medianAge  : 51;
  return (
    <section className="section" data-screen-label="04 Age">
      <Reveal stagger>
        <div className="grid-12" style={{ alignItems: 'start' }}>
          <div className="col-5">
            <SectionHead
              eyebrow="03 · Age"
              title={filtered ? `Median age: ${median}.` : "The median founder is 51."}
              caption={
                filtered
                  ? `Beeswarm rebuilt from filtered ages (n = ${filtered.withAgeCount}).`
                  : "India's IPO-bound founders skew older than the global startup stereotype. Half are 51 or above; one in ten is past 70. The youngest in the dataset is 20; the oldest is 92."
              }
            />
          </div>
          <div className="col-7">
            <Beeswarm buckets={buckets} median={median} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Section 04 — Gender ── */
function Sec04() {
  const { filtered } = useFiltered();
  const total  = filtered ? (filtered.gender.male + filtered.gender.female) : 1416;
  const female = filtered ? filtered.gender.female : 360;
  const male   = total - female;
  const pct = total > 0 ? (female / total * 100).toFixed(1) : '0.0';
  return (
    <section className="section" data-screen-label="05 Gender">
      <Reveal>
        <SectionHead
          eyebrow="04 · Gender"
          title="A gender count, dot by dot."
          caption={`Of ${total.toLocaleString()} founders whose gender we could verify, ${female.toLocaleString()} are women — ${pct}%. Each square below is one founder.`}
        />
        <div style={{ marginTop: 32 }}>
          <DotGrid total={total} female={female} male={male} />
        </div>
      </Reveal>
    </section>
  );
}

/* ── Section 05 — Classrooms (education) ── */
function Sec05() {
  const { filtered } = useFiltered();
  const levels = filtered ? filtered.educationLevels : D.educationLevels;
  const degrees = filtered ? filtered.topDegrees : D.topDegrees;
  const insts = filtered ? filtered.topInstitutions : D.topInstitutions;

  return (
    <section className="section" data-screen-label="06 Education">
      <Reveal stagger>
        <SectionHead
          eyebrow="05 · Classrooms"
          title="Education shapes who gets to file an IPO."
          caption="Three readings: degree level, specific qualifications, and the institutions that produced the most founders. 871 of 1,450 founders disclose education (60% coverage)."
        />

        {/* 05a Education level */}
        <div style={{ marginTop: 56 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>05A · Level of education</div>
          <EducationStack levels={levels} />
        </div>

        {/* 05b/c degrees + institutions */}
        <div className="grid-12" style={{ marginTop: 72, alignItems: 'start' }}>
          <div className="col-6">
            <div className="head-row" style={{ marginBottom: 16 }}>
              <div className="eyebrow">05B · Top 10 degrees</div>
            </div>
            <TypographicRanking rows={degrees} caption="Most common qualifications" />
          </div>
          <div className="col-6">
            <div className="head-row" style={{ marginBottom: 16 }}>
              <div className="eyebrow">05C · Top 10 institutions</div>
            </div>
            <TypographicRanking rows={insts} caption="Universities & institutes" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Section 06 — Field of study + Industries ── */
function Sec06() {
  return (
    <section className="section" data-screen-label="07 Industries">
      <Reveal stagger>
        <div className="grid-12" style={{ alignItems: 'start' }}>
          <div className="col-5">
            <SectionHead
              eyebrow="06 · Industries"
              title="What they built."
              caption="Industry classification of all 480 issuers. Fintech and finance dominate the pipeline at 55.2%, but most of these are NBFCs and housing-finance companies, not the consumer fintech you read about."
            />

            <div style={{ marginTop: 32 }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>06A · Field of study</div>
              <FieldList data={D.fieldsOfStudy} />
            </div>
          </div>
          <div className="col-7">
            <div className="eyebrow" style={{ marginBottom: 16 }}>06B · Companies by industry</div>
            <IndustryTreemap data={D.industries} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FieldList({ data }) {
  const max = Math.max(...data.map(d=>d.value));
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => { const id = requestAnimationFrame(() => setSeen(true)); return () => cancelAnimationFrame(id); }, []);
  return (
    <div className="field-list">
      {data.map((d, i) => (
        <div className="field-row" key={i}>
          <span className="nm">{d.name}</span>
          <div className="field-track">
            <div className="field-bar" style={{ width: seen ? `${(d.value/max)*100}%` : 0, transitionDelay: `${i*40}ms` }} />
          </div>
          <span className="vl mono">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Section 07 — Notes & coverage ── */
function Sec07Notes({ onMethodology }) {
  return (
    <section className="section" data-screen-label="08 Notes">
      <Reveal>
        <SectionHead
          eyebrow="07 · Notes & coverage"
          title="On the data."
        />
        <div className="notes">
          <p><b>Coverage.</b> DRHPs vary in biographical detail. Gender is known for 1,416 of 1,450 founders (98%). Education appears in 871 cases (60%). Age is available for 750 (52%). Hometown city and state for only 474 (33%).</p>
          <p><b>Classification.</b> 906 founders are confirmed promoters explicitly labelled on the DRHP cover sheet. A further 544 are likely founders — Managing Directors and Chairmen whose tenure and shareholding history support founding involvement. The remaining 7,627 people in the wider dataset are KMPs, directors and family members, excluded from this issue.</p>
          <p><b>Nationality.</b> 1,439 of 1,450 founders are Indian (99.2%). The remaining eleven hold Singaporean, Italian, American or other passports.</p>
          <p><b>What we did not measure.</b> Caste, family wealth and prior funding history were excluded — not because they don't matter, but because DRHPs do not disclose them reliably enough to publish responsibly.</p>
          <p style={{ marginTop: 24 }}>
            Data sourced from SEBI Draft Red Herring Prospectuses, March 2021 – March 2026.{' '}
            <a className="lede-link" onClick={onMethodology}>Read the full methodology →</a>
          </p>
        </div>
      </Reveal>
    </section>
  );
}

function Colophon() {
  return (
    <div className="colophon">
      <Reveal>
        <div className="colophon-mark">Fin.</div>
        <div className="colophon-text">
          Founder Insights · Vol. 01 · 2026<br />
          Set in Fraunces, Instrument Sans and JetBrains Mono<br />
          Built with SEBI data · No ads · No tracking
        </div>
      </Reveal>
    </div>
  );
}

/* ── Top-level Issue with filters wiring ── */
function Issue({ onReset }) {
  const [showMod, setShowMod] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState(null);

  // Recompute filtered aggregates from row-level FOUNDERS data.
  const filtered = React.useMemo(() => {
    if (!filters) return null;
    const all = window.FOUNDERS || [];
    let rows = all;
    if (filters.gender) rows = rows.filter(r => r.gn === filters.gender);
    if (filters.state)  rows = rows.filter(r => r.st === filters.state);
    if (filters.ageMin != null) rows = rows.filter(r => r.age != null && r.age >= filters.ageMin);
    if (filters.ageMax != null) rows = rows.filter(r => r.age != null && r.age <= filters.ageMax);
    return computeAggregates(rows);
  }, [filters]);

  const hasFilters = !!(filters && (filters.gender || filters.state || filters.ageMin != null || filters.ageMax != null));

  return (
    <FiltersCtx.Provider value={{ filters, setFilters, filtered: hasFilters ? filtered : null }}>
      <div className="issue-wrap" data-screen-label="Dashboard">
        <Masthead
          onMethodology={() => setShowMod(true)}
          onFiltersToggle={() => setFiltersOpen(o => !o)}
          hasFilters={hasFilters}
        />
        <FilterBar
          open={filtersOpen}
          filters={filters}
          setFilters={setFilters}
          onClose={() => setFiltersOpen(false)}
        />
        <main className="issue">
          <Sec01 />
          <Sec02 />
          <PullQuote>Two states account for 16% of every founder we examined.</PullQuote>
          <Sec03 />
          <Sec04 />
          <Sec05 />
          <PullQuote>More B.Com graduates than IIT alumni. By a factor of three.</PullQuote>
          <Sec06 />
          <Sec07Notes onMethodology={() => setShowMod(true)} />
          <Colophon />
        </main>
        {showMod && <MethodologyModal onClose={() => setShowMod(false)} />}
      </div>
    </FiltersCtx.Provider>
  );
}

/* ── Aggregator: compute aggregates from row-level data ── */
function computeAggregates(rows) {
  const tally = (fn) => {
    const m = new Map();
    for (const r of rows) {
      const k = fn(r);
      if (k == null || k === '') continue;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a,b) => b[1]-a[1]).map(([name, value]) => ({ name, value }));
  };

  // Ages
  const ages = rows.map(r => r.age).filter(a => typeof a === 'number').sort((a,b)=>a-b);
  const medianAge = ages.length ? ages[Math.floor(ages.length/2)] : 0;
  const ageBuckets = [];
  for (let lo = 20; lo <= 90; lo += 5) {
    const hi = lo + 4;
    ageBuckets.push({ bucket: `${lo}–${hi}`, value: ages.filter(a => a >= lo && a <= hi).length });
  }

  // Gender
  const g = tally(r => r.gn);
  const male = (g.find(x => x.name === 'Male') || { value: 0 }).value;
  const female = (g.find(x => x.name === 'Female') || { value: 0 }).value;

  // Education level
  const edu = tally(r => r.el);
  const eduTotal = edu.reduce((s,x)=>s+x.value, 0);
  const educationLevels = edu.map(x => ({
    name: x.name, value: x.value,
    pct: eduTotal ? +(x.value / eduTotal * 100).toFixed(1) : 0
  }));

  // Industries — by unique company within the filtered rows
  const companyToType = new Map();
  for (const r of rows) if (r.cn && r.ct) companyToType.set(r.cn, r.ct);
  const indMap = new Map();
  for (const t of companyToType.values()) indMap.set(t, (indMap.get(t) || 0) + 1);
  const indArr = [...indMap.entries()].sort((a,b)=>b[1]-a[1]).map(([name,value])=>({ name, value, pct: companyToType.size ? +(value/companyToType.size*100).toFixed(2) : 0 }));

  // KPI for the filtered cohort
  const kpi = [
    { value: companyToType.size.toLocaleString(), label: 'companies\nin slice' },
    { value: rows.length.toLocaleString(),         label: 'founders\nin slice' },
    { value: medianAge ? String(medianAge) : '—',  label: 'median\nage'         },
    { value: ages.length ? ages.length.toLocaleString() : '—', label: 'with age\nrecorded' },
  ];

  return {
    kpi,
    rows,
    withAgeCount: ages.length,
    medianAge,
    ageBuckets,
    gender: { male, female },
    educationLevels,
    topDegrees:      tally(r => r.dg).slice(0, 10),
    topInstitutions: tally(r => r.inst).slice(0, 10),
    topStates:       tally(r => r.st).slice(0, 10),
    industries:      indArr,
  };
}

Object.assign(window, { Issue, MethodologyModal });

import { useMemo, useState } from 'react'

const stack = [
  { mark: 'B', name: 'NBG', title: 'Domains + interfaces', text: 'Defines where state lives, how domains nest, and where constrained interfaces exist.' },
  { mark: '→', name: 'Conveyor', title: 'Between-step state', text: 'Treats transport itself as a first-class object carrying symbol, frame, polarity, residue, flux, and provenance.' },
  { mark: 'G', name: 'Gear', title: 'Ordered recurrence', text: 'Captures cycle current and ordered transformation. Same ingredients can produce different outcomes when order matters.' },
  { mark: 'A', name: 'Altermath', title: 'Causal structure behind zero', text: 'Studies distinctions erased by a coarse cancellation map but retained in future behavior.' },
  { mark: '◉', name: 'Keyholes', title: 'Observer projections', text: 'Specifies what a given observer can distinguish now, and what a deeper probe may reveal later.' },
  { mark: 'Φ', name: 'Φ-System', title: 'Convergence control', text: 'Separates fixed, periodic, steady-throughput, behavioral, and provenance convergence.' },
  { mark: '#', name: 'Ledger', title: 'Replayable provenance', text: 'Records how state was produced so identical outputs need not imply identical causal histories.' },
]

const experiments = [
  ['AH2', 'Latent causal residue', '29/29', '6/6'],
  ['AH3', 'Boundary transfer', '89/89', '7/7'],
  ['AH4', 'Two-interface holonomy', '44/44', '8/8'],
  ['AH5', 'Noncommuting order', '36/36', '8/8'],
  ['AH6', 'Closed commutator loop', '41/41', '9/9'],
  ['AH7', 'Oriented cancellation', '65/65', '9/9'],
  ['AH8', 'Plaquette transport', '63/63', '10/10'],
]

const keyholes = [
  {
    label: 'O₀ · Snapshot',
    visible: 'Node state only',
    hides: 'Flux, path, cycle, provenance',
    line: 'P₀(Ω) = X',
    insight: 'Two systems can look identical even while one is actively circulating.'
  },
  {
    label: 'O₁ · Flux',
    visible: 'Node state + current',
    hides: 'Ordered path + loop history',
    line: 'P₁(Ω) = (X, J)',
    insight: 'Steady state no longer means “nothing is happening.”'
  },
  {
    label: 'O₂ · Path',
    visible: 'Current + ordered transformations',
    hides: 'Global cycle topology',
    line: 'P₂(Ω) = (X, J, MΓ)',
    insight: 'AB and BA can be distinguishable even with the same ingredients.'
  },
  {
    label: 'O₃ · Cycle',
    visible: 'Closed-loop residue / Gear state',
    hides: 'Full provenance ledger',
    line: 'P₃(Ω) = (X, J, Mγ, Rγ)',
    insight: 'A loop can close observationally while the full state does not.'
  },
  {
    label: 'O₄ · Ledger',
    visible: 'State + process + provenance',
    hides: 'Only what the declared model never records',
    line: 'P₄(Ω) = receipt chain',
    insight: 'Same output can still have a different causal history.'
  },
]

function Formula({ children }) {
  return <div className="formula">{children}</div>
}

function App() {
  const [depth, setDepth] = useState(0)
  const active = keyholes[depth]

  const totalChecks = useMemo(
    () => experiments.reduce((sum, row) => sum + Number(row[2].split('/')[0]), 0),
    [],
  )

  return (
    <main>
      <header className="nav">
        <a className="brand" href="#top"><span>Φ</span> NBG Research Lab</a>
        <nav>
          <a href="#stack">Stack</a>
          <a href="#keyholes">Keyholes</a>
          <a href="#experiments">Experiments</a>
          <a href="#claims">Claims</a>
          <a href="https://github.com/MichaelWave369/NestedBubbleGear">GitHub ↗</a>
        </nav>
      </header>

      <section id="top" className="hero">
        <div className="hero-grid" />
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="eyebrow">ENTER THE FIELD · NESTED BUBBLE/GEAR</div>
        <h1>What survives<br /><em>the apparent zero?</em></h1>
        <p className="lede">
          A reproducible research program for hidden causal residue, interface transport,
          ordered composition, observer keyholes, and local-to-global structure.
        </p>
        <Formula>
          <span>P(X) = P(X′)</span>
          <strong>but</strong>
          <span>∃ w : P(ρ(w)X) ≠ P(ρ(w)X′)</span>
        </Formula>
        <div className="hero-actions">
          <a className="button primary" href="#experiments">Explore the evidence ladder</a>
          <a className="button ghost" href="#keyholes">Open the keyhole</a>
        </div>
        <div className="stats">
          <div><strong>AH2→AH8</strong><span>frozen experiment ladder</span></div>
          <div><strong>{totalChecks}</strong><span>frozen acceptance checks passed</span></div>
          <div><strong>7</strong><span>layers in the current stack</span></div>
        </div>
      </section>

      <section className="section intro">
        <div className="section-label">THE CORE IDEA</div>
        <div className="two-col">
          <h2>Identical now does not mean behaviorally equivalent.</h2>
          <div>
            <p>
              NBG asks what happens when a coarse observer merges states that a future,
              admissible interaction can later distinguish. The project treats boundaries,
              transport, path order, closed loops, and observation as explicit mathematical objects.
            </p>
            <p className="muted">
              The experiments are finite toy models. They earn the next mathematical question.
              They do not turn speculative cosmology into evidence by sheer enthusiasm.
            </p>
          </div>
        </div>
      </section>

      <section id="stack" className="section">
        <div className="section-label">THE STACK</div>
        <h2>One architecture, seven jobs.</h2>
        <div className="stack-grid">
          {stack.map((item, i) => (
            <article className="stack-card" key={item.name}>
              <div className="stack-top"><span className="stack-mark">{item.mark}</span><span>0{i + 1}</span></div>
              <h3>{item.name}</h3>
              <h4>{item.title}</h4>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="keyholes" className="section keyhole-section">
        <div className="section-label">INTERACTIVE KEYHOLE</div>
        <div className="two-col">
          <div>
            <h2>Change the observer.<br />Change what counts as “the same.”</h2>
            <p className="muted">Widen the aperture to reveal structure hidden by shallower projections.</p>
            <div className="depth-buttons">
              {keyholes.map((k, i) => (
                <button
                  key={k.label}
                  className={i === depth ? 'active' : ''}
                  onClick={() => setDepth(i)}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="keyhole-panel">
            <div className="keyhole-visual">
              <div className="keyhole-ring">
                <div className="keyhole-core">Φ</div>
              </div>
              <div className="scan-lines" />
            </div>
            <div className="keyhole-copy">
              <span className="pill">{active.label}</span>
              <h3>{active.visible}</h3>
              <code>{active.line}</code>
              <dl>
                <div><dt>Visible</dt><dd>{active.visible}</dd></div>
                <div><dt>Still hidden</dt><dd>{active.hides}</dd></div>
              </dl>
              <p>{active.insight}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="experiments" className="section">
        <div className="section-label">FROZEN EXPERIMENT LADDER</div>
        <div className="section-heading-row">
          <h2>Each rung has to earn the next one.</h2>
          <span className="status">REPLAYABLE · CONTROLLED · HASHED</span>
        </div>

        <div className="experiment-list">
          {experiments.map(([id, title, checks, tests], i) => (
            <article className="experiment" key={id}>
              <div className="experiment-index">{String(i + 2).padStart(2, '0')}</div>
              <div>
                <h3>{id}</h3>
                <p>{title}</p>
              </div>
              <div className="pass-cell"><span>PASS</span><strong>{checks}</strong><small>checks</small></div>
              <div className="pass-cell"><strong>{tests}</strong><small>unit tests</small></div>
            </article>
          ))}
        </div>

        <div className="progression">
          <span>latent residue</span><i>→</i>
          <span>boundary transfer</span><i>→</i>
          <span>path order</span><i>→</i>
          <span>loop residue</span><i>→</i>
          <span>orientation</span><i>→</i>
          <span>plaquettes</span>
        </div>
      </section>

      <section className="section concepts">
        <div className="section-label">THREE USEFUL EQUATIONS</div>
        <div className="equation-grid">
          <article>
            <span className="num">01</span>
            <h3>Altermath witness</h3>
            <Formula><span>X ~<sub>P</sub> X′</span><strong>and</strong><span>X ≉ X′</span></Formula>
            <p>Indistinguishable through the current keyhole, distinguishable under some admissible future operation.</p>
          </article>
          <article>
            <span className="num">02</span>
            <h3>Gear current</h3>
            <Formula><span>BJ = 0</span><strong>while</strong><span>J ≠ 0</span></Formula>
            <p>No net accumulation can coexist with a nonzero cycle-space current.</p>
          </article>
          <article>
            <span className="num">03</span>
            <h3>Observable loop closure</h3>
            <Formula><span>π(Lx) = π(x)</span><strong>while</strong><span>Lx ≠ x</span></Formula>
            <p>The declared observable can return even when the full state retains loop residue.</p>
          </article>
        </div>
      </section>

      <section id="claims" className="section claims">
        <div className="section-label">CLAIM FIREWALL</div>
        <h2>Keep the fun. Keep the epistemology.</h2>
        <div className="claim-grid">
          <article className="claim demonstrated">
            <span>DEMONSTRATED</span>
            <h3>Finite toy-model results</h3>
            <p>Hidden residue, boundary transfer, noncommuting order, closed-loop residue, inverse cancellation, and local/global plaquette cancellation.</p>
          </article>
          <article className="claim formal">
            <span>UNDER DEVELOPMENT</span>
            <h3>Formal machinery</h3>
            <p>Flux Altermath, conveyor calculus, keyhole hierarchy, cycle-space Gears, and local-to-global transport composition.</p>
          </article>
          <article className="claim speculative">
            <span>SPECULATIVE</span>
            <h3>Physical interpretation</h3>
            <p>Horizons, cosmological nesting, black/white interface polarity, and any claim about fundamental spacetime remain hypotheses.</p>
          </article>
        </div>
      </section>

      <section className="section manifesto">
        <div>
          <span className="section-label">CURRENT NORTH STAR</span>
          <blockquote>
            “The Gear is the circulation that survives when accumulation cancels.”
          </blockquote>
        </div>
        <div className="manifesto-note">
          <p>
            The project is deliberately built as an executable ladder rather than a single grand theory.
            Frozen protocols, negative controls, exact enumeration, and explicit failure classes come first.
          </p>
        </div>
      </section>

      <footer>
        <div><span className="footer-phi">Φ</span><strong>Nested Bubble/Gear</strong></div>
        <p>Experimental mathematics · reproducible toy models · claim firewall intact.</p>
        <div className="footer-links">
          <a href="https://github.com/MichaelWave369/NestedBubbleGear">Repository</a>
          <a href="https://zenodo.org/communities/enter-the-field-phi369/records">Zenodo Community</a>
        </div>
      </footer>
    </main>
  )
}

export default App

(() => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.primary-nav');

  if (toggle && nav) {
    const closeNav = () => {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
      const isOpen = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });
  }

  document.querySelectorAll('details').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      document.querySelectorAll('details[open]').forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  const copyButton = document.querySelector('[data-copy-proposition]');
  const copyStatus = document.querySelector('.copy-status');
  const proposition = 'Protect the worker. Fund the pathway. Verify the skill. Let the worker own the record. Publish the result. Stop the program if it does not work.';

  if (copyButton && copyStatus) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(proposition);
        copyStatus.textContent = 'COPIED TO CLIPBOARD';
      } catch {
        copyStatus.textContent = proposition;
      }
    });
  }
})();

(() => {
  const form = document.querySelector('[data-router-form]');
  const input = document.querySelector('#service-request');
  const state = document.querySelector('[data-router-state]');
  if (!form || !input || !state) return;

  document.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = button.dataset.example || '';
      input.focus();
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    renderLoading();
    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const payload = await response.json().catch(() => ({}));
      renderPayload(payload);
    } catch {
      renderError('The router could not reach its server.', 'No destination was guessed. Please try again later.');
    }
  });

  function clearState() {
    while (state.firstChild) state.removeChild(state.firstChild);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function renderLoading() {
    clearState();
    const box = el('div', 'router-loading');
    box.append(el('span', 'router-loader'));
    const copy = el('div');
    copy.append(el('b', '', 'Checking reviewed service records…'));
    copy.append(el('div', 'data', 'THE MODEL MAY VERIFY ONE RECORD OR ABSTAIN'));
    box.append(copy);
    state.append(box);
  }

  function renderPayload(payload) {
    if (payload.status === 'match') return renderMatch(payload);
    if (payload.status === 'escalation') return renderEscalation(payload.record);
    if (payload.status === 'abstain') return renderAbstain(payload);
    if (payload.status === 'unavailable') return renderError('The router is installed, but the model is not connected yet.', payload.message || payload.setup);
    return renderError('The request could not be routed.', payload.message || 'Try naming the document, benefit, agency, or life event.');
  }

  function renderMatch(payload) {
    clearState();
    const record = payload.record;
    const result = el('div', 'router-result');
    result.append(el('div', 'agency', record.agency_full));
    result.append(el('h3', '', record.name));
    result.append(el('p', '', record.plain_summary));

    const facts = el('div', 'router-facts');
    if (record.disclosure?.free) facts.append(el('span', 'router-fact -free', 'Free service'));
    if (record.cost) facts.append(el('span', 'router-fact', record.cost));
    if (record.typical_duration) facts.append(el('span', 'router-fact', record.typical_duration));
    if (record.channels?.length) facts.append(el('span', 'router-fact', record.channels.join(' · ').replaceAll('_', ' ')));
    if (record.type === 'handoff') facts.append(el('span', 'router-fact', `${record.administration_level} program`));
    result.append(facts);

    if (record.type === 'journey') result.append(renderJourney(record));
    else result.append(renderThreshold(record));

    const meta = el('div', 'router-result-meta');
    const stamp = el('span', 'stamp -verified');
    const b = el('b');
    b.dataset.glyph = '✓';
    b.append(el('span', '', record.display_state === 'stale' ? 'Review due' : 'Reviewed'));
    stamp.append(b, el('i', 'data', `${record.reviewed_at || 'date unavailable'} · ${record.id}`));
    meta.append(stamp);
    meta.append(el('span', 'data', `${Math.round((payload.confidence || 0) * 100)}% VERIFIER CONFIDENCE · ${payload.latency_ms || 0}MS`));
    result.append(meta);
    state.append(result);
  }

  function renderThreshold(record) {
    const threshold = el('div', 'router-threshold');
    const bar = el('div', 'router-threshold-bar');
    bar.append(el('span', '', 'Leaving this project'), el('span', 'data', record.id));
    threshold.append(bar);

    const body = el('div', 'router-threshold-body');
    const destination = el('div', 'router-destination');
    destination.append(el('span', '', record.disclosure?.destination_label || new URL(record.destination).hostname));
    destination.append(el('span', 'official', record.disclosure?.official === false ? 'Not government-operated' : '✓ Official source'));
    body.append(destination);
    body.append(el('p', 'router-operator', `Operated by ${record.disclosure?.operator || record.agency_full}.`));
    body.append(el('p', 'router-why', record.disclosure?.why || record.plain_summary));

    if (record.jurisdiction_prompt) {
      body.append(el('p', 'data', `ON THE NEXT SITE: ${record.jurisdiction_prompt}`));
    }

    const actions = el('div', 'actions');
    const link = el('a', 'btn btn-primary', `Continue to ${record.disclosure?.destination_label || 'official site'}`);
    link.href = record.destination;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    actions.append(link);
    body.append(actions);
    threshold.append(body);
    return threshold;
  }

  function renderJourney(record) {
    const box = el('div');
    const list = el('div', 'router-journey');
    (record.steps || []).forEach((step, index) => {
      const row = el('div', 'router-journey-step');
      row.append(el('span', '', index + 1));
      const copy = el('div');
      const link = el('a', '', step.name);
      if (step.destination) {
        link.href = step.destination;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      copy.append(link);
      const detail = [step.timing, step.conditional_on].filter(Boolean).join(' · ');
      if (detail) copy.append(el('small', '', detail));
      row.append(copy);
      list.append(row);
    });
    box.append(list);
    box.append(el('p', 'caveat', record.not_exhaustive_notice));
    return box;
  }

  function renderAbstain(payload) {
    clearState();
    const box = el('div', 'router-abstain');
    box.append(el('h3', '', 'The correct answer here is: not sure yet.'));
    box.append(el('p', '', payload.message || 'The router did not find one clear official path.'));
    if (payload.clarifying_question) box.append(el('p', 'router-why', payload.clarifying_question));
    if (Array.isArray(payload.possible_matches) && payload.possible_matches.length) {
      const possible = el('div', 'router-possible');
      payload.possible_matches.forEach((match) => possible.append(el('span', '', `${match.name} — ${match.agency}`)));
      box.append(possible);
    }
    if (payload.fallback?.destination) {
      const link = el('a', 'btn btn-secondary', payload.fallback.name || 'Browse USA.gov');
      link.href = payload.fallback.destination;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      box.append(link);
    }
    state.append(box);
  }

  function renderEscalation(record) {
    clearState();
    const box = el('div', 'router-emergency');
    box.append(el('div', 'data', 'A WEBSITE IS NOT THE FIRST STEP'));
    box.append(el('strong', '', record.contact));
    box.append(el('p', '', record.plain_summary));
    const link = el('a', 'btn btn-primary', `Call ${record.contact}`);
    link.href = `tel:${String(record.contact).replace(/[^0-9]/g, '')}`;
    box.append(link);
    state.append(box);
  }

  function renderError(title, message) {
    clearState();
    const box = el('div', 'router-error');
    box.append(el('h3', '', title));
    box.append(el('p', '', message || 'No destination was selected.'));
    state.append(box);
  }
})();

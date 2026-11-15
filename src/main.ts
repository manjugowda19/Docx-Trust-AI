import './styles.css';
import { api } from '@appdeploy/client';

type Page = 'overview' | 'verify' | 'evidence' | 'reviews' | 'audit';
const app = document.querySelector('#app')!;
const content = document.querySelector('#pageContent')!;
const title = document.querySelector('#pageTitle')!;
let currentPage: Page = 'overview';
let lastResult: any = null;

const icon = (name: string) => {
  const paths: Record = {
    shield:
      'd="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/>d="m8.5 12 2.2 2.2 4.8-5"/>',
    file: 'd="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>d="M14 2v6h6M8 13h8M8 17h8"/>',
    check: 'd="m5 12 4 4L19 6"/>',
    clock: 'cx="12" cy="12" r="9"/>d="M12 7v5l3 2"/>',
    search: 'cx="11" cy="11" r="7"/>d="m20 20-4-4"/>',
    plus: 'd="M12 5v14M5 12h14"/>',
  };
  return (
    'viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
    (paths[name] || paths.file) +
    ''
  );
};
const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(
    /[&lt;>"']/g,
    c =>
      ({ '&': '&amp;', '': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!
  );
const setPage = async (page: Page) => {
  currentPage = page;
  document
    .querySelectorAll('.nav-item')
    .forEach(b => b.classList.toggle('active', b.dataset.page === page));
  title.textContent = (
    {
      overview: 'Overview',
      verify: 'Verify claim',
      evidence: 'Evidence library',
      reviews: 'Review queue',
      audit: 'Audit trail',
    } as Record
  )[page];
  await render();
};
const panel = (heading: string, body: string, action = '') =>
  '' +
  heading +
  '' +
  action +
  '' +
  body +
  '';
const demoPanel = () => panel(
  'Explore Demo Mode',
  'Try the workflow with prepared examples. Demo results are simulated for presentation only: they do not call Gemini, search the live web, create verification records, or count in dashboard statistics.' + 'Demo Actions: Try a supported claim | Try a contradicted claim | Try an uncertain claim' + 'Use live verification above whenever Gemini API quota is available.',
);
const bindDemoButtons = () => {
  document.querySelectorAll('.demo-case').forEach(button =>
    button.addEventListener('click', () => {
      const examples: Record = {
        supported: { claim: 'Water boils at 100°C at standard atmospheric pressure.', status: 'VERIFIED', explanation: 'Demo scenario: the prepared example illustrates a claim supported under the stated standard-pressure condition.', analysis: 'This is a simulated walkthrough result. In live mode, DocxTrust would search current sources and assess the exact conditions before assigning a verdict.' },
        contradicted: { claim: 'The Sun revolves around the Earth.', status: 'BLOCKED', explanation: 'Demo scenario: the prepared example illustrates a claim that conflicts with established astronomical evidence.', analysis: 'This is a simulated walkthrough result. In live mode, DocxTrust would search reliable astronomy sources and cite the evidence used.' },
        uncertain: { claim: 'A newly announced local policy takes effect tomorrow.', status: 'NEEDS_REVIEW', explanation: 'Demo scenario: without an identified jurisdiction and official notice, the claim needs more evidence.', analysis: 'This example demonstrates why missing context or sources should lead to NEEDS_REVIEW rather than an unsupported true/false verdict.' }
      };
      const selected = examples[button.dataset.case || 'uncertain'];
      lastResult = { ...selected, model: 'Prepared example · simulated', webSources: [], evidence: [], demo: true };
      setPage('verify');
    })
  );
};
async function render() {
  content.innerHTML = 'Loading workspace…';
  try {
    if (currentPage === 'overview') {
      const { data } = await api.get('/api/dashboard/stats');
      const stats = data.stats || {};
      const recent = data.recent || [];
      content.innerHTML =
        'Evidence-first analysis' +
        'Make decisions you can trace.' +
        'Compare claims against trusted source material and understand exactly what supports the result.' +
        'Verify a claim' +
        '' +
        [
          ['Evidence sources', stats.evidence || 0],
          ['Verifications', stats.verifications || 0],
          ['Verified', stats.verified || 0],
          ['Needs review', stats.needsReview || 0],
        ]
          .map(
            ([l, v]) =>
              '' +
              l +
              '' +
              v +
              ''
          )
          .join('') +
        '' +
        panel(
          'Recent verification activity',
          recent.length
            ? 'Claim | Status | Date' +
                recent
                  .map(
                    (r: any) =>
                      '' +
                      escapeHtml(r.claim) +
                      '' +
                      String(r.status).toLowerCase() +
                      '' +
                      escapeHtml(r.status) +
                      '' +
                      new Date(r.createdAt).toLocaleString() +
                      ''
                  )
                  .join('') +
                ''
            : 'No verification activity yet. Add evidence, then verify your first claim.'
        ) +
        '' +
        panel(
          'Evidence library',
          'Store policies, reports and trusted source passages for claim checking.' + 'Add evidence'
        ) +
        panel(
          'Human oversight',
          'Review ambiguous or conflicting results and preserve the decision history.' + 'Open review queue'
        ) +
        '' + demoPanel();
      bindDemoButtons();
      document
        .querySelector('#goVerify')
        ?.addEventListener('click', () => setPage('verify'));
      document
        .querySelector('#goEvidence')
        ?.addEventListener('click', () => setPage('evidence'));
      document
        .querySelector('#goReviews')
        ?.addEventListener('click', () => setPage('reviews'));
    } else if (currentPage === 'evidence') {
      const { data } = await api.get('/api/evidence');
      const items = data.items || [];
      content.innerHTML =
        'Add trusted source material. Verification results can only cite evidence stored here.' +
        panel(
          'Add evidence',
          'Evidence title' + 'e.g. Student handbook — attendance policy' + 'Source name' + 'e.g. University registrar' + 'Category' + 'Policy | Research | Guideline | Other' + 'Evidence text' + 'Paste the trusted passage or extracted document text here…' + 'PDF/DOCX/TXT: extract the relevant text and paste it here. TXT upload is supported below.' + 'Save evidence'
        ) +
        panel(
          'Stored evidence',
          (items.length
              ? items
                  .map(
                    (e: any) =>
                      '' +
                      icon('file') +
                      '' +
                      escapeHtml(e.title) +
                      '' +
                      escapeHtml(e.sourceName) +
                      ' · ' +
                      escapeHtml(e.category) +
                      ' · ' +
                      new Date(e.createdAt).toLocaleDateString() +
                      '' +
                      escapeHtml(e.text.slice(0, 220)) +
                      (e.text.length > 220 ? '…' : '') +
                      '' +
                      escapeHtml(e.id) +
                      'Delete'
                  )
                  .join('')
              : 'No evidence stored yet.') +
            ''
        );
      const file = document.querySelector('#evidenceFile');
      file?.addEventListener('change', async () => {
        const f = file.files?.[0];
        if (f) {
          const t = await f.text();
          document.querySelector('[name=text]')!.value = t;
          if (!document.querySelector('[name=title]')!.value)
            document.querySelector('[name=title]')!.value =
              f.name;
        }
      });
      document
        .querySelector('#evidenceForm')
        ?.addEventListener('submit', async ev => {
          ev.preventDefault();
          const form = ev.currentTarget as HTMLFormElement;
          const fd = new FormData(form);
          const msg = document.querySelector('#evidenceMessage')!;
          try {
            await api.post('/api/evidence', {
              title: fd.get('title'),
              sourceName: fd.get('sourceName'),
              category: fd.get('category'),
              text: fd.get('text'),
            });
            msg.textContent = 'Evidence saved.';
            await render();
          } catch (e: any) {
            msg.textContent = e?.message || 'Could not save evidence.';
          }
        });
      document
        .querySelectorAll('.delete-evidence')
        .forEach(button => {
          button.addEventListener('click', async () => {
            const row = button.closest('.evidence-row');
            if (!row) return;
            if (button.dataset.confirm !== 'yes') {
              button.dataset.confirm = 'yes';
              button.textContent = 'Confirm delete';
              const cancel = document.createElement('button');
              cancel.type = 'button';
              cancel.className = 'button text-button cancel-delete';
              cancel.textContent = 'Cancel';
              button.after(cancel);
              cancel.addEventListener('click', () => {
                button.dataset.confirm = '';
                button.textContent = 'Delete';
                cancel.remove();
              });
              return;
            }
            button.disabled = true;
            button.textContent = 'Deleting…';
            let feedback = row.querySelector('.delete-feedback');
            if (!feedback) {
              feedback = document.createElement('p');
              feedback.className = 'form-message delete-feedback';
              row.appendChild(feedback);
            }
            try {
              const { data } = await api.delete(
                '/api/evidence/' + encodeURIComponent(button.dataset.id || '')
              );
              if (!data?.deleted) {
                throw new Error('The server did not confirm the deletion.');
              }
              await render();
            } catch (cause: unknown) {
              button.disabled = false;
              button.dataset.confirm = '';
              button.textContent = 'Delete';
              row.querySelector('.cancel-delete')?.remove();
              feedback.textContent =
                cause instanceof Error
                  ? cause.message
                  : 'Could not delete evidence. Please refresh and retry.';
            }
          });
        });
    } else if (currentPage === 'verify') {
      content.innerHTML =
        'Live claims are researched with Gemini Google Search. If Gemini is unavailable or returns no grounding sources, DocxTrust tries Groq browser search. Results are saved only when usable source citations are available. Saved evidence is optional context.' +
        demoPanel() +
        panel(
          'Claim to verify',
          'Claim or AI-generated response' + 'Paste the statement you want to verify…' + 'Additional context (optional)' + 'Where did this claim come from?' + 'Internet research runs automatically. Unclear or conflicting findings are sent for review.' + 'Search web & verify'
        ) +
        (lastResult ? resultHtml(lastResult) : '');
      bindDemoButtons();
      document
        .querySelector('#verifyForm')
        ?.addEventListener('submit', async ev => {
          ev.preventDefault();
          const fd = new FormData(ev.currentTarget as HTMLFormElement);
          const msg = document.querySelector('#verifyMessage')!;
          msg.textContent = 'Searching the web, comparing sources and checking the claim…';
          try {
            const { data } = await api.post('/api/verify', {
              claim: fd.get('claim'),
              context: fd.get('context'),
            });
            lastResult = data.result;
            await render();
          } catch (e: any) {
            const message = String(
              e?.response?.data?.error || e?.data?.error || e?.message || ''
            );
            const status = Number(e?.response?.status || e?.status || 0);
            if (/429|quota|rate limit/i.test(message) || status === 429) {
              msg.textContent =
                'Gemini reached its API quota or rate limit. DocxTrust tried the Groq backup when configured. Your claim was not saved unless a source-cited result appears. Check provider usage and try again.';
            } else if (
              status === 503 ||
              /503|both providers|Groq backup/i.test(message)
            ) {
              msg.textContent =
                message ||
                'Live verification is temporarily unavailable. Check that GROQ_API_KEY is configured in AppDeploy secrets and that at least one provider is available. No unsupported verdict was saved.';
            } else {
              msg.textContent = message || 'Verification failed. Please try again.';
            }
          }
        });
      document
        .querySelectorAll('.open-review')
        .forEach(b => b.addEventListener('click', () => setPage('reviews')));
    } else if (currentPage === 'reviews') {
      const { data } = await api.get('/api/reviews');
      const items = data.items || [];
      content.innerHTML =
        'Human reviewers can record a decision without overwriting the original AI assessment.' +
        panel(
          'Pending human review',
          items.length
            ? items
                .map(
                  (r: any) =>
                    '' +
                    String(r.status).toLowerCase() +
                    '' +
                    escapeHtml(r.status) +
                    '' +
                    new Date(r.createdAt).toLocaleString() +
                    '' +
                    escapeHtml(r.claim) +
                    '' +
                    escapeHtml(r.explanation) +
                    '' +
                    escapeHtml(r.id) +
                    'Approve as verified | Keep needs review | Override as blocked' + 'Reason for your decision' + 'Save review'
                )
                .join('')
            : 'No items are waiting for human review.'
        );
      document.querySelectorAll('.review-form').forEach(f =>
        f.addEventListener('submit', async ev => {
          ev.preventDefault();
          const fd = new FormData(f);
          const button = f.querySelector('button');
          const feedback = document.createElement('p');
          feedback.className = 'form-message full';
          f.appendChild(feedback);
          if (button) button.disabled = true;
          try {
            const { data } = await api.post('/api/reviews/' + f.dataset.id, {
              decision: fd.get('decision'),
              reason: fd.get('reason'),
            });
            if (!data.saved) throw new Error('The review was not confirmed as saved.');
            feedback.textContent = 'Review saved. The original AI assessment has been preserved.';
            await render();
          } catch (e: any) {
            feedback.textContent = e?.message || 'Could not save this review. Please retry.';
            if (button) button.disabled = false;
          }
        })
      );
    } else {
      const { data } = await api.get('/api/audit');
      const items = data.items || [];
      content.innerHTML = panel(
        'Audit history',
        items.length
          ? '' +
              items
                .map(
                  (a: any) =>
                    '' +
                    escapeHtml(a.eventType) +
                    '' +
                    escapeHtml(a.details) +
                    '' +
                    new Date(a.createdAt).toLocaleString() +
                    ''
                )
                .join('') +
              ''
          : 'No audit events have been recorded yet.'
      );
    }
  } catch (e: any) {
    content.innerHTML =
      'Could not load this section. ' +
      escapeHtml(e?.message || 'Please refresh and try again.') +
      '';
  }
}
function resultHtml(r: any) {
  const web = (r.webSources || [])
    .map((source: any) => '' + escapeHtml(source.title) + '' + escapeHtml(source.url) + 'Open source' + '')
    .join('');
  const ev = (r.evidence || [])
    .map(
      (e: any) =>
        '' +
        escapeHtml(e.title) +
        '' +
        'Source: ' +
        escapeHtml(e.sourceName || 'Stored evidence') +
        '' +
        escapeHtml(e.passage) +
        '' +
        'Source ID: ' +
        escapeHtml(e.id) +
        ''
    )
 .join('');
  return panel(
    r.demo ? 'Simulated demo result' : 'Verification result',
    (r.demo ? 'DEMO ONLY — NOT A LIVE VERIFICATION. This prepared result is illustrative and was not checked against live sources. It has not been saved to the audit trail or dashboard.' : '') +
    '' +
      String(r.status).toLowerCase() +
      '' +
      escapeHtml(r.status) +
      '' +
      escapeHtml(r.model) +
      '' +
      escapeHtml(r.claim) +
      '' +
      escapeHtml(r.explanation) +
      '' +
      '' +
      'What supports or contradicts the claim' +
      escapeHtml(r.analysis || 'No further analysis supplied.') +
      '' +
      '' +
      'Internet sources' +
      (web || 'No verifiable web sources were returned. Keep this result under review.') +
      'Saved evidence (optional)' +
      (ev || 'No matching saved evidence was supplied.') +
      '' +
      '' + 'Send to human review'
  );
}
document
 .querySelectorAll('.nav-item')
 .forEach(b =>
    b.addEventListener('click', () => setPage(b.dataset.page as Page))
  );
document
 .querySelector('#themeToggle')
 ?.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('docxtrust-theme', dark ? 'dark' : 'light');
  });
if (localStorage.getItem('docxtrust-theme') === 'dark')
  document.documentElement.classList.add('dark');
setPage('overview');
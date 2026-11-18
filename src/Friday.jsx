import { Fragment, useEffect, useRef, useState } from 'react';
import { person } from './content.js';

// F.R.I.D.A.Y.: a small chat assistant that only talks about Gurkirat.
// A launcher sits bottom-right once the intro is over; it opens a panel (full screen on phones).
// Questions go to /api/friday (server side, where the Groq key lives); answers stream in as text.

const WELCOME =
  "Hi, I'm F.R.I.D.A.Y. Ask me anything about Gurkirat: projects, experience, skills, hackathons or how to get in touch.";
const SUGGESTIONS = [
  'What has Gurkirat built?',
  'Tell me about RokdaDaav',
  'What does Gurkirat do at TensorHub?',
  'Which hackathons did Gurkirat win?',
  'How can I contact Gurkirat?',
];

// Minimal, safe formatting for answers: paragraphs, "- " lists, **bold**, and links.
// Everything is rendered as React text; no HTML from the model is ever injected.
const LINK = /(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g;
function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, k) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={k}>{part.slice(2, -2)}</strong>;
    return (
      <Fragment key={k}>
        {part.split(LINK).map((bit, j) => {
          if (/^https?:\/\//.test(bit)) {
            const clean = bit.replace(/[.,;:]+$/, '');
            return (
              <Fragment key={j}>
                <a href={clean} target="_blank" rel="noreferrer">
                  {clean.replace(/^https?:\/\//, '')}
                </a>
                {bit.slice(clean.length)}
              </Fragment>
            );
          }
          if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(bit)) {
            const clean = bit.replace(/[.,;:]+$/, '');
            return (
              <Fragment key={j}>
                <a href={`mailto:${clean}`}>{clean}</a>
                {bit.slice(clean.length)}
              </Fragment>
            );
          }
          return bit;
        })}
      </Fragment>
    );
  });
}
function Answer({ text }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw) => {
    const line = raw.trim();
    const item = line.match(/^[-*•]\s+(.*)$/);
    if (item) {
      if (!list) blocks.push((list = { list: [] }));
      list.list.push(item[1]);
    } else {
      list = null;
      if (line) blocks.push({ p: line });
    }
  });
  return blocks.map((b, k) =>
    b.list ? (
      <ul key={k}>
        {b.list.map((x, j) => (
          <li key={j}>
            <Inline text={x} />
          </li>
        ))}
      </ul>
    ) : (
      <p key={k}>
        <Inline text={b.p} />
      </p>
    ),
  );
}

export default function Friday({ visible }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role, content, error? }
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const launcher = useRef(null);
  const field = useRef(null);
  const log = useRef(null);
  const abort = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    field.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        launcher.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Keep the newest text in view while an answer streams in.
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  useEffect(() => () => abort.current?.abort(), []);

  async function ask(question) {
    const q = question.trim().slice(0, 800);
    if (!q || busy) return;
    const history = [...messages.filter((m) => !m.error), { role: 'user', content: q }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setBusy(true);
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const res = await fetch('/api/friday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'F.R.I.D.A.Y. could not answer just now.');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const shown = text;
        setMessages((m) => [...m.slice(0, -1), { role: 'assistant', content: shown }]);
      }
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setMessages((m) => [
        ...m.slice(0, -1),
        { role: 'assistant', error: true, content: `${e.message} You can also email Gurkirat at ${person.email}.` },
      ]);
    } finally {
      if (abort.current === ctrl) setBusy(false);
    }
  }

  const fresh = messages.length === 0;
  const waiting = busy && messages[messages.length - 1]?.content === '';

  return (
    <div className={`friday ${visible ? 'is-on' : ''} ${open ? 'is-open' : ''}`}>
      <section
        className="friday__panel"
        id="friday-panel"
        role="dialog"
        aria-modal="false"
        aria-label="F.R.I.D.A.Y., chat about Gurkirat"
        hidden={!open}
      >
        <header className="friday__head">
          <span className="friday__core" aria-hidden="true" />
          <div className="friday__title">
            <p className="friday__name">F.R.I.D.A.Y.</p>
            <p className="friday__sub">Ask about Gurkirat</p>
          </div>
          <button
            type="button"
            className="friday__close"
            aria-label="Close chat"
            onClick={() => {
              setOpen(false);
              launcher.current?.focus();
            }}
          >
            <span aria-hidden="true" />
          </button>
        </header>

        <div className="friday__log" ref={log} data-lenis-prevent aria-live="polite">
          <div className="friday__msg is-bot">
            <p>{WELCOME}</p>
          </div>
          {messages.map((m, k) =>
            m.role === 'user' ? (
              <div className="friday__msg is-user" key={k}>
                <p>{m.content}</p>
              </div>
            ) : (
              <div className={`friday__msg is-bot ${m.error ? 'is-error' : ''}`} key={k}>
                {m.content ? <Answer text={m.content} /> : null}
                {waiting && k === messages.length - 1 && (
                  <span className="friday__typing" aria-label="F.R.I.D.A.Y. is typing">
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </div>
            ),
          )}
          {fresh && (
            <div className="friday__suggest">
              {SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => ask(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          className="friday__form"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <label className="sr-only" htmlFor="friday-input">
            Your question for F.R.I.D.A.Y.
          </label>
          <input
            id="friday-input"
            ref={field}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about projects, skills, experience…"
            maxLength={800}
            autoComplete="off"
          />
          <button type="submit" className="friday__send" disabled={busy || !input.trim()} aria-label="Send question">
            <span aria-hidden="true" />
          </button>
        </form>
        <p className="friday__note">Answers come only from this portfolio.</p>
      </section>

      <button
        type="button"
        className="friday__launch"
        ref={launcher}
        aria-expanded={open}
        aria-controls="friday-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="friday__core" aria-hidden="true" />
        <span className="friday__launch-text">{open ? 'Close' : 'Ask F.R.I.D.A.Y.'}</span>
      </button>
    </div>
  );
}

// Live board for the profile README. Reads every Velque market straight from
// Solana, adds the last five Nasdaq sessions of each stock, and draws one
// animated SVG per colour scheme into dist/.
import { Connection, PublicKey } from '@solana/web3.js';
import { bookPda, readMarket, readBook, readDay, session, nasdaqOpen, nextNasdaqChange } from 'velque-sdk';
import { mkdirSync, writeFileSync } from 'node:fs';

const MARKETS = [
  { symbol: 'NVDA', token: 'tNVDAx', market: 'D7eareS94eDwofGZQHJK3egWz21hFbKAoYsh6CHBKSxU' },
  { symbol: 'TSLA', token: 'tTSLAx', market: '38TWU27AJKSoZNgPNXgjJj7Ca79CTmMjVwTD8dnHBt1V' },
  { symbol: 'AAPL', token: 'tAAPLx', market: '69Y5pKhoXk9HxBTYqpQwYWEPtZb9nrD9oDP9XdHe3GWy' },
];
const RPCS = (process.env.VELQUE_RPC || 'https://api.devnet.solana.com,https://solana-devnet.api.onfinality.io/public').split(',');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// public endpoints rate-limit: rotate and back off instead of failing the run
let turn = 0;
async function rpc(fn) {
  for (let i = 0; ; i++) {
    try {
      return await fn(new Connection(RPCS[turn % RPCS.length], 'confirmed'));
    } catch (e) {
      if (i >= 6) throw e;
      turn++;
      await sleep(1200 * (i + 1));
    }
  }
}

/** Closing prices of the last five Nasdaq sessions, half-hour bars. Empty if the source is down. */
async function nasdaqWeek(symbol) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=30m&range=5d`, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; velque-board/1.0)', accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json();
    return (j?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter((v) => typeof v === 'number');
  } catch {
    return [];
  }
}

const now = Math.floor(Date.now() / 1000);
const px = (v) => Number(v) / 1e6;
const rows = [];
for (const m of MARKETS) {
  const market = new PublicKey(m.market);
  const mk = await rpc((c) => readMarket(c, market));
  const day = await rpc((c) => readDay(c, market));
  const book = await rpc((c) => readBook(c, bookPda(market, mk.auctionId)));
  rows.push({
    ...m,
    session: session(mk, now),
    reference: px(mk.reference),
    every: Number(mk.windowSecs),
    band: Number(mk.bandBps) / 100,
    window: Number(mk.auctionId),
    cleared: Number(mk.auctionsCleared),
    waiting: book ? book.orders.filter((o) => o.status === 'live').length : 0,
    bid: day.bids[0] ? px(day.bids[0].price) : null,
    ask: day.asks[0] ? px(day.asks[0].price) : null,
    week: await nasdaqWeek(m.symbol),
  });
}

const isDay = rows.some((r) => r.session === 'day');
const open = nasdaqOpen(now);
const change = nextNasdaqChange(now);
const utc = (sec, withDay) => {
  const d = new Date(sec * 1000);
  const hm = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
  return withDay ? `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]} ${hm}` : hm;
};
const money = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cleared = rows.reduce((n, r) => n + r.cleared, 0);

const THEMES = {
  light: { bg: '#ffffff', border: '#f1dbe3', ink: '#2a1228', text: '#4a3346', muted: '#8a7585', line: '#f3e6ec', spark: '#e86a97', up: '#1f8f78', down: '#c4487a', pill: '#2a1228', pillText: '#ffffff', day: '#2fa88f', dot: '#f58aae' },
  dark: { bg: '#1b1420', border: '#3a2836', ink: '#fbeef4', text: '#d9c7d3', muted: '#9a8494', line: '#2e2030', spark: '#f58aae', up: '#7fd9c4', down: '#f58aae', pill: '#f58aae', pillText: '#2a1228', day: '#7fd9c4', dot: '#2a1228' },
};
const W = 880;
const H = 330;
const PAD = 28;
const COL = (W - PAD * 2) / 3;
const SANS = "ui-sans-serif, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const every = (sec) => (sec % 60 ? `${sec} s` : `${sec / 60} min`);
const rule = (r) => (r.session === 'day' ? `inside ${r.band}% of the Nasdaq price` : `clears every ${every(r.every)} at one price`);

function spark(values, x, y, w, h) {
  if (values.length < 2) return null;
  const step = Math.max(1, Math.floor(values.length / 64));
  const v = values.filter((_, i) => i % step === 0 || i === values.length - 1);
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const pts = v.map((p, i) => [x + (i / (v.length - 1)) * w, y + h - ((p - lo) / (hi - lo || 1)) * h]);
  const line = pts.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`).join(' ');
  return { line, area: `${line} L${(x + w).toFixed(1)} ${y + h + 6} L${x.toFixed(1)} ${y + h + 6} Z`, end: pts[pts.length - 1], pct: ((v[v.length - 1] - v[0]) / v[0]) * 100 };
}

function draw(name) {
  const t = THEMES[name];
  const pill = isDay ? { fill: t.day, text: name === 'dark' ? '#12261f' : '#ffffff', label: 'DAY' } : { fill: t.pill, text: t.pillText, label: 'DARK' };
  const headline = isDay
    ? 'Nasdaq is open. One continuous book, price then time.'
    : 'Nasdaq is closed. Orders collect and clear together at one price.';
  const next = change ? `${open ? 'closes' : 'opens'} ${utc(change, !open)}` : '';
  const cols = rows.map((r, i) => {
    const x = PAD + i * COL + (i ? 22 : 0);
    const w = COL - (i ? 22 : 0) - (i < 2 ? 22 : 0);
    const s = spark(r.week, x, 172, w, 44);
    const delay = (0.25 + i * 0.35).toFixed(2);
    const state = r.session === 'day'
      ? (r.bid && r.ask ? `bid ${r.bid.toFixed(2)} · ask ${r.ask.toFixed(2)}` : 'the day book is open')
      : (r.waiting ? `${r.waiting} order${r.waiting === 1 ? '' : 's'} waiting in window #${r.window}` : `window #${r.window} is open`);
    return `
  ${i ? `<line x1="${(PAD + i * COL).toFixed(1)}" y1="98" x2="${(PAD + i * COL).toFixed(1)}" y2="270" stroke="${t.line}"/>` : ''}
  <g class="in" style="animation-delay:${delay}s">
    <text x="${x.toFixed(1)}" y="114" font-family="${MONO}" font-size="12" letter-spacing="1.4" fill="${t.muted}">${r.token}</text>
    <text x="${(x + w).toFixed(1)}" y="114" text-anchor="end" font-family="${MONO}" font-size="11.5" fill="${t.muted}">${r.symbol} on Nasdaq, 5 sessions</text>
    <text x="${x.toFixed(1)}" y="152" font-family="${SANS}" font-size="29" font-weight="700" fill="${t.ink}">${money(r.reference)}</text>
    ${s ? `<text x="${(x + w).toFixed(1)}" y="151" text-anchor="end" font-family="${MONO}" font-size="14" font-weight="600" fill="${s.pct >= 0 ? t.up : t.down}">${s.pct >= 0 ? '+' : ''}${s.pct.toFixed(2)}%</text>` : ''}
    <text x="${x.toFixed(1)}" y="246" font-family="${SANS}" font-size="13.5" fill="${t.text}">${state}</text>
    <text x="${x.toFixed(1)}" y="266" font-family="${SANS}" font-size="12.5" fill="${t.muted}">${rule(r)}</text>
  </g>
  ${s ? `<path class="area" style="animation-delay:${delay}s" d="${s.area}" fill="url(#fade-${name})"/>
  <path class="spark" style="animation-delay:${delay}s" pathLength="1" d="${s.line}" fill="none" stroke="${t.spark}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <g class="tip" style="animation-delay:${delay}s"><circle cx="${s.end[0].toFixed(1)}" cy="${s.end[1].toFixed(1)}" r="3.4" fill="${t.spark}"/><circle cx="${s.end[0].toFixed(1)}" cy="${s.end[1].toFixed(1)}" r="3.4" fill="none" stroke="${t.spark}"><animate attributeName="r" values="3.4;10" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="1.8s" repeatCount="indefinite"/></circle></g>` : ''}`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Velque test market, read from Solana devnet">
  <defs>
    <linearGradient id="fade-${name}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.spark}" stop-opacity=".22"/><stop offset="1" stop-color="${t.spark}" stop-opacity="0"/></linearGradient>
    <linearGradient id="sweep-${name}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.spark}" stop-opacity="0"/><stop offset=".5" stop-color="${t.spark}"/><stop offset="1" stop-color="${t.spark}" stop-opacity="0"/></linearGradient>
    <clipPath id="card-${name}"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="20"/></clipPath>
  </defs>
  <style>
    .in{opacity:0;animation:in .8s ease-out forwards}
    .spark{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 10s ease-in-out infinite}
    .area{opacity:0;animation:area 10s ease-in-out infinite}
    .tip{opacity:0;animation:tip 10s ease-in-out infinite}
    @keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    @keyframes draw{0%{stroke-dashoffset:1;opacity:1}26%{stroke-dashoffset:0}92%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
    @keyframes area{0%,18%{opacity:0}32%,92%{opacity:1}100%{opacity:0}}
    @keyframes tip{0%,24%{opacity:0}28%,92%{opacity:1}100%{opacity:0}}
    @media (prefers-reduced-motion:reduce){.in,.spark,.area,.tip{animation:none;opacity:1;stroke-dashoffset:0}}
  </style>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="20" fill="${t.bg}" stroke="${t.border}" stroke-width="1.5"/>
  <g clip-path="url(#card-${name})">
    <line x1="0" y1="78" x2="${W}" y2="78" stroke="${t.line}"/>
    <rect y="77" width="170" height="2" fill="url(#sweep-${name})"><animate attributeName="x" values="-170;${W}" dur="5.5s" repeatCount="indefinite"/></rect>
    <line x1="0" y1="286" x2="${W}" y2="286" stroke="${t.line}"/>
  </g>
  <rect x="${PAD}" y="25" width="${isDay ? 68 : 76}" height="30" rx="15" fill="${pill.fill}"/>
  <circle cx="${PAD + 16}" cy="40" r="4" fill="${isDay ? pill.text : t.dot}"><animate attributeName="opacity" values="1;.25;1" dur="1.6s" repeatCount="indefinite"/></circle>
  <text x="${PAD + 27}" y="44.5" font-family="${MONO}" font-size="11.5" font-weight="700" letter-spacing="1.6" fill="${pill.text}">${pill.label}</text>
  <text x="${PAD + (isDay ? 82 : 90)}" y="45" font-family="${SANS}" font-size="14.5" font-weight="600" fill="${t.ink}">${headline}</text>
  <text x="${W - PAD}" y="45" text-anchor="end" font-family="${MONO}" font-size="12" fill="${t.muted}">${next}</text>
  ${cols}
  <text x="${PAD}" y="311" font-family="${SANS}" font-size="12.5" fill="${t.muted}">${cleared.toLocaleString('en-US')} auction windows cleared on chain</text>
  <text x="${W - PAD}" y="311" text-anchor="end" font-family="${MONO}" font-size="11.5" fill="${t.muted}">Solana devnet · read from chain ${utc(now)}</text>
</svg>
`;
}

mkdirSync('dist', { recursive: true });
for (const name of Object.keys(THEMES)) writeFileSync(`dist/board-${name}.svg`, draw(name));
console.log(rows.map((r) => `${r.token} ${r.session} ${r.reference} window #${r.window} waiting ${r.waiting} week ${r.week.length}`).join('\n'));

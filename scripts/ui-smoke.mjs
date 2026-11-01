import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = process.env.STORI_URL || 'http://127.0.0.1:5173';
const browserPaths = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);
const chrome = browserPaths.find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome or Edge is required.');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'stori-ui-'));
const port = 18000 + Math.floor(Math.random() * 2000);
const browser = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + port, '--user-data-dir=' + temp, 'about:blank'
], { stdio: 'ignore', windowsHide: true });
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function pageSocket() {
  for (let i = 0; i < 45; i++) {
    try {
      const pages = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      const page = pages.find(x => x.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error('Chrome DevTools did not start.');
}
let ws;
let seq = 0;
const pending = new Map();
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = (await cdp('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true
  })).result;
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function until(selector) {
  for (let i = 0; i < 40; i++) {
    if (await evaluate('Boolean(document.querySelector(' + JSON.stringify(selector) + '))')) return;
    await sleep(150);
  }
  throw new Error('Missing element: ' + selector);
}
function check(ok, message) {
  if (!ok) throw new Error('UI smoke failed: ' + message);
  console.log('PASS ' + message);
}
try {
  const response = await fetch(origin);
  if (!response.ok) throw new Error('Frontend server returned HTTP ' + response.status);
  ws = new WebSocket(await pageSocket());
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) return;
    const current = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) current.reject(new Error(message.error.message));
    else current.resolve(message);
  });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false
  });
  await cdp('Page.navigate', { url: origin + '/login' });
  await until('.auth-form-card');
  const authFont = await evaluate("parseFloat(getComputedStyle(document.querySelector('.auth-heading p')).fontSize)");
  check(authFont >= 16, 'Login description font >= 16px (' + authFont + 'px)');

  await evaluate("sessionStorage.setItem('stori.demo','true');");
  await cdp('Page.navigate', { url: origin + '/dashboard' });
  await until('.metric-card');
  const desktop = await evaluate("({ count:document.querySelectorAll('.metric-card').length, nav:parseFloat(getComputedStyle(document.querySelector('.nav-link')).fontSize), supporting:parseFloat(getComputedStyle(document.querySelector('.metric-card p')).fontSize), overflow:document.documentElement.scrollWidth > innerWidth + 2 })");
  check(desktop.count === 3, 'Demo dashboard renders summary cards');
  check(desktop.nav >= 15 && desktop.supporting >= 14, 'Desktop font sizes: nav ' + desktop.nav + 'px, copy ' + desktop.supporting + 'px');
  check(!desktop.overflow, 'Desktop dashboard has no horizontal overflow');

  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 375, height: 812, deviceScaleFactor: 1, mobile: true
  });
  await sleep(500);
  const mobile = await evaluate("({ viewport:innerWidth, scrollWidth:document.documentElement.scrollWidth, nav:parseFloat(getComputedStyle(document.querySelector('.bottom-link')).fontSize), visible:getComputedStyle(document.querySelector('.bottom-nav')).display !== 'none' })");
  check(mobile.visible, 'Mobile bottom navigation is visible');
  check(mobile.nav >= 12, 'Mobile nav font >= 12px (' + mobile.nav + 'px)');
  check(mobile.scrollWidth <= mobile.viewport + 2, 'Mobile viewport has no horizontal overflow (' + mobile.scrollWidth + '/' + mobile.viewport + ')');
  const routes = [
    ['/experiences', '.experience-grid'],
    ['/applications', '.application-grid'],
    ['/experiences/demo-exp-1', '.detail-two-columns'],
    ['/applications/demo-app-1', '.editor-layout'],
    ['/settings', '.settings-layout']
  ];
  for (const [route, selector] of routes) {
    await cdp('Page.navigate', { url: origin + route });
    await until(selector);
    const dimensions = await evaluate("({ width:innerWidth, content:document.documentElement.scrollWidth })");
    check(dimensions.content <= dimensions.width + 2, route + ' fits mobile viewport');
  }
  console.log('UI smoke passed.');
} finally {
  try { ws?.close(); } catch {}
  browser.kill();
  await sleep(250);
  try { fs.rmSync(temp, { recursive: true, force: true }); } catch {}
}

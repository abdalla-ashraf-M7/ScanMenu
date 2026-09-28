import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const origin = process.env.SCANMENU_ORIGIN || "http://localhost:3000";
const out = path.resolve("docs/portfolio/raw");
fs.mkdirSync(out, { recursive: true });

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "scanmenu-capture-"));
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore", windowsHide: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
let nextId = 0;
const pending = new Map();

async function waitUntil(fn, label, timeout = 45000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await fn();
    if (result) return result;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function command(method, params = {}) {
  const id = ++nextId;
  const response = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  socket.send(JSON.stringify({ id, method, params }));
  return response;
}

async function evaluate(expression) {
  const reply = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.text);
  return reply.result?.value;
}

async function navigate(url, readyExpression) {
  await command("Page.navigate", { url: `${origin}${url}` });
  await waitUntil(async () => await evaluate(readyExpression), url);
  await sleep(700);
}

async function shot(name, directory = out) {
  const { data } = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(path.join(directory, name), Buffer.from(data, "base64"));
  process.stdout.write(`${name}\n`);
}

try {
  const port = await waitUntil(() => {
    const file = path.join(profile, "DevToolsActivePort");
    return fs.existsSync(file) ? Number(fs.readFileSync(file, "utf8").split("\n")[0]) : null;
  }, "Chrome DevTools port");
  const page = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
  socket = new WebSocket(page.webSocketDebuggerUrl);
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 });
  await command("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });

  await navigate("/m/al-amal", "document.querySelector('h1')?.textContent?.includes('Al Amal Kitchen')");
  await shot("menu-en.png");
  await evaluate("document.querySelector('button[aria-label^=\"Add Half Grilled Chicken\"]')?.click()");
  await waitUntil(async () => await evaluate("document.body.innerText.includes('Your cart')"), "cart bar");
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Your cart'))?.click()");
  await waitUntil(async () => await evaluate("document.querySelector('[role=dialog]')?.textContent?.includes('Your order')"), "cart sheet");
  await shot("cart-en.png");

  await navigate("/login", "document.body.innerText.includes('Demo accounts:')");
  await evaluate(`document.querySelector('input[name=email]').value='owner@demo.menu'; document.querySelector('input[name=password]').value='demo1234'; document.querySelector('button[type=submit]').click();`);
  await waitUntil(async () => await evaluate("location.pathname === '/dashboard' && document.body.innerText.includes('Manage menu')"), "owner dashboard");
  await shot("dashboard-en.png");
  await navigate("/dashboard/menu", "document.body.innerText.includes('New category')");
  await shot("menu-manager-en.png");

  await evaluate("[...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Switch to Arabic')?.click()");
  await waitUntil(async () => await evaluate("document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl' && document.querySelector('main h1')?.textContent?.includes('المنيو')"), "Arabic switch");
  await navigate("/dashboard/menu", "document.documentElement.lang === 'ar' && document.querySelector('main h1')?.textContent?.includes('المنيو')");
  process.stdout.write("Arabic switch: content and RTL persisted after reload\n");

  await command("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false, screenWidth: 1600, screenHeight: 1000 });
  await command("Emulation.setTouchEmulationEnabled", { enabled: false });
  const platesUrl = pathToFileURL(path.resolve("docs/portfolio/plates.html")).href;
  const plateNames = [
    ["cover", "scanmenu-portfolio-cover.png"],
    ["order", "scanmenu-order-flow.png"],
    ["owner", "scanmenu-owner-dashboard.png"],
  ];
  for (const [plate, filename] of plateNames) {
    await command("Page.navigate", { url: `${platesUrl}?plate=${plate}` });
    await waitUntil(async () => await evaluate(`document.getElementById('${plate}')?.classList.contains('active') && [...document.images].every(i => i.complete && i.naturalWidth > 0)`), `portfolio plate ${plate}`);
    await sleep(250);
    await shot(filename, path.resolve("docs/portfolio"));
  }
} finally {
  socket?.close();
  chrome.kill();
}

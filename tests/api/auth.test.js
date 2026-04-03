const BASE = process.env.API_URL || "http://localhost:4000";

const req = async (method, path, body) => {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
};

let passed = 0, failed = 0;
const test = async (name, fn) => {
  try { await fn(); console.log(`  ✔  ${name}`); passed++; }
  catch (e) { console.error(`  ✗  ${name}: ${e.message}`); failed++; }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

(async () => {
  console.log("\n── Auth API Tests ──");

  await test("Health check", async () => {
    const d = await req("GET", "/health");
    assert(d.ok === true, "Health not ok");
  });

  await test("Register returns 201 or 409", async () => {
    const r = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User", email: "test@test.com", password: "Test@1234" }),
    });
    assert([201, 409].includes(r.status), `Unexpected status ${r.status}`);
  });

  await test("Login with wrong password returns 401", async () => {
    const r = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "wrongpassword" }),
    });
    assert(r.status === 401 || r.status === 403, `Expected 401/403 got ${r.status}`);
  });

  await test("Protected route without token returns 401", async () => {
    const r = await fetch(`${BASE}/auth/me`);
    assert(r.status === 401, `Expected 401 got ${r.status}`);
  });

  console.log(`\n  Passed: ${passed}  Failed: ${failed}\n`);
  process.exit(failed > 0 ? 1 : 0);
})();

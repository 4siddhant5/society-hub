const BASE = process.env.API_URL || "http://localhost:4000";
let passed = 0, failed = 0;
const test = async (name, fn) => {
  try { await fn(); console.log(`  ✔  ${name}`); passed++; }
  catch (e) { console.error(`  ✗  ${name}: ${e.message}`); failed++; }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

(async () => {
  console.log("\n── Notices API Tests ──");

  await test("GET /notices without token returns 401", async () => {
    const r = await fetch(`${BASE}/notices`);
    assert(r.status === 401, `Expected 401 got ${r.status}`);
  });

  await test("POST /notices without token returns 401", async () => {
    const r = await fetch(`${BASE}/notices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "t", body: "b" }),
    });
    assert(r.status === 401, `Expected 401 got ${r.status}`);
  });

  console.log(`\n  Passed: ${passed}  Failed: ${failed}\n`);
  process.exit(failed > 0 ? 1 : 0);
})();

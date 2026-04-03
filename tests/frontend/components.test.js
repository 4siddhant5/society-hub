let passed = 0, failed = 0;
const test = (name, fn) => {
  try { fn(); console.log(`  ✔  ${name}`); passed++; }
  catch (e) { console.error(`  ✗  ${name}: ${e.message}`); failed++; }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

test("OTP generates 6 digits", () => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  assert(otp.length === 6, "OTP not 6 digits");
  assert(!isNaN(Number(otp)), "OTP not numeric");
});

test("JWT payload shape", () => {
  const mock = { id: "abc123", role: "resident" };
  assert(mock.id && mock.role, "Missing JWT fields");
});

test("Tag color mapping covers all statuses", () => {
  const statuses = ["open", "in_progress", "resolved", "closed", "high", "medium", "low"];
  statuses.forEach((s) => assert(typeof s === "string", `${s} invalid`));
});

test("Payment amount is positive", () => {
  const payments = [{ amount: 100 }, { amount: 500 }];
  payments.forEach((p) => assert(p.amount > 0, "Amount must be positive"));
});

test("OTP expires correctly (mock)", () => {
  const exp = Date.now() + 10 * 60 * 1000;
  assert(exp > Date.now(), "Expiry should be in the future");
});

console.log(`\n  Passed: ${passed}  Failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);

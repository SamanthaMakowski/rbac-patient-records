const assert = require("assert");
const { filterPatientForRole, getWithheldFields } = require("./policy");

const samplePatient = {
  id: "P001",
  name: "Test Patient",
  dateOfBirth: "1990-01-01",
  phone: "212-555-0000",
  address: "1 Test St, New York, NY 10001",
  appointment: "2026-08-01 9:00 AM, Dr. Test",
  insurance: "Test PPO, member 0000-000-00",
  ssn: "000-00-0000",
  diagnosis: "Test diagnosis",
  medications: ["Test med 10mg"],
  clinicalNotes: "Test clinical note."
};

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${description}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${description}`);
    console.log(`        ${err.message}`);
  }
}

console.log("\nRBAC policy tests\n");

test("doctor sees clinical fields", () => {
  const result = filterPatientForRole(samplePatient, "doctor");
  assert.ok("diagnosis" in result);
  assert.ok("medications" in result);
  assert.ok("clinicalNotes" in result);
});

test("doctor does not see insurance", () => {
  const result = filterPatientForRole(samplePatient, "doctor");
  assert.ok(!("insurance" in result));
});

test("doctor has ssn redacted, not raw", () => {
  const result = filterPatientForRole(samplePatient, "doctor");
  assert.strictEqual(result.ssn, "Restricted: not permitted for your role");
});

test("nurse sees diagnosis but not clinical notes", () => {
  const result = filterPatientForRole(samplePatient, "nurse");
  assert.ok("diagnosis" in result);
  assert.ok(!("clinicalNotes" in result));
});

test("receptionist sees no clinical fields", () => {
  const result = filterPatientForRole(samplePatient, "receptionist");
  assert.ok(!("diagnosis" in result));
  assert.ok(!("medications" in result));
  assert.ok(!("clinicalNotes" in result));
});

test("receptionist sees insurance", () => {
  const result = filterPatientForRole(samplePatient, "receptionist");
  assert.ok("insurance" in result);
});

test("admin sees raw ssn", () => {
  const result = filterPatientForRole(samplePatient, "admin");
  assert.strictEqual(result.ssn, "000-00-0000");
});

test("admin sees no clinical fields", () => {
  const result = filterPatientForRole(samplePatient, "admin");
  assert.ok(!("diagnosis" in result));
});

test("unknown role gets empty object, fail closed", () => {
  const result = filterPatientForRole(samplePatient, "hacker");
  assert.deepStrictEqual(result, {});
});

test("no role can see raw ssn except admin", () => {
  ["doctor", "nurse", "receptionist"].forEach((role) => {
    const result = filterPatientForRole(samplePatient, role);
    assert.notStrictEqual(result.ssn, "000-00-0000");
  });
});

test("getWithheldFields reports clinical omitted for receptionist", () => {
  const withheld = getWithheldFields(samplePatient, "receptionist");
  assert.ok(withheld.omitted.includes("diagnosis"));
  assert.ok(withheld.redacted.includes("ssn"));
});

console.log(`\n${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
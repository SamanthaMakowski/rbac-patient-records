const express = require("express");
const path = require("path");
const { filterPatientForRole, getWithheldFields } = require("./rbac/policy");
const data = require("./data/patients.json");

const app = express();
const PORT = process.env.PORT || 3000;

const auditLog = [];

function recordAccess(role, patient) {
  const withheld = getWithheldFields(patient, role);
  const entry = {
    timestamp: new Date().toISOString(),
    role: role,
    patientId: patient.id,
    patientName: patient.name,
    omitted: withheld.omitted,
    redacted: withheld.redacted
  };
  auditLog.unshift(entry);
  if (auditLog.length > 50) {
    auditLog.pop();
  }
  console.log(
    `[AUDIT] ${entry.timestamp} role=${role} patient=${patient.id} ` +
    `omitted=[${withheld.omitted.join(",")}] redacted=[${withheld.redacted.join(",")}]`
  );
}

app.use(express.static(path.join(__dirname, "..", "client")));

app.get("/api/patients", (req, res) => {
  const role = req.query.role;
  const filtered = data.patients.map((patient) =>
    filterPatientForRole(patient, role)
  );
  res.json(filtered);
});

app.get("/api/patients/:id", (req, res) => {
  const role = req.query.role;
  const patient = data.patients.find((p) => p.id === req.params.id);

  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  recordAccess(role, patient);
  res.json(filterPatientForRole(patient, role));
});

app.get("/api/audit-log", (req, res) => {
  res.json(auditLog);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
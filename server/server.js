const express = require("express");
const path = require("path");
const { filterPatientForRole } = require("./rbac/policy");
const data = require("./data/patients.json");

const app = express();
const PORT = process.env.PORT || 3000;

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

  res.json(filterPatientForRole(patient, role));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
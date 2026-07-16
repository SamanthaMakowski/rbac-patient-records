const roleSelect = document.getElementById("role-select");
const patientList = document.getElementById("patient-list");
const patientDetail = document.getElementById("patient-detail");
const auditList = document.getElementById("audit-list");

let patients = [];
let selectedPatientId = null;

const fieldLabels = {
  name: "Name",
  dateOfBirth: "Date of Birth",
  phone: "Phone",
  address: "Address",
  appointment: "Appointment",
  insurance: "Insurance",
  ssn: "SSN",
  diagnosis: "Diagnosis",
  medications: "Medications",
  clinicalNotes: "Clinical Notes"
};

const fieldSections = [
  { title: "Demographics", fields: ["phone", "address", "appointment"] },
  { title: "Insurance & Billing", fields: ["insurance", "ssn"] },
  { title: "Clinical", fields: ["diagnosis", "medications", "clinicalNotes"] }
];

function calculateAge(dob) {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

async function loadPatients() {
  const role = roleSelect.value;
  const response = await fetch(`/api/patients?role=${role}`);
  patients = await response.json();
  renderPatientList();

  if (selectedPatientId) {
    loadPatientDetail(selectedPatientId);
  }
}

function renderPatientList() {
  patientList.innerHTML = "";

  patients.forEach((patient) => {
    const li = document.createElement("li");
    li.textContent = `${patient.name} (${patient.id})`;
    li.classList.add("patient-item");
    if (patient.id === selectedPatientId) {
      li.classList.add("selected");
    }
    li.addEventListener("click", () => loadPatientDetail(patient.id));
    patientList.appendChild(li);
  });
}

async function loadPatientDetail(id) {
  selectedPatientId = id;
  const role = roleSelect.value;
  const response = await fetch(`/api/patients/${id}?role=${role}`);
  const patient = await response.json();
  renderPatientDetail(patient);
  renderPatientList();
  loadAuditLog();
}

function renderPatientDetail(patient) {
  patientDetail.classList.remove("empty");
  patientDetail.innerHTML = "";

  const banner = document.createElement("div");
  banner.classList.add("patient-banner");
  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : "";
  banner.innerHTML = `
    <div class="banner-name">${patient.name}</div>
    <div class="banner-meta">MRN ${patient.id} &nbsp;&middot;&nbsp; DOB ${patient.dateOfBirth} &nbsp;&middot;&nbsp; Age ${age}</div>
  `;
  patientDetail.appendChild(banner);

  fieldSections.forEach((section) => {
    const visibleFields = section.fields.filter((field) => field in patient);
    if (visibleFields.length === 0) return;

    const sectionEl = document.createElement("div");
    sectionEl.classList.add("chart-section");

    const header = document.createElement("h3");
    header.classList.add("section-header");
    header.textContent = section.title;
    sectionEl.appendChild(header);

    visibleFields.forEach((field) => {
      const row = document.createElement("div");
      row.classList.add("field-row");
      const value = Array.isArray(patient[field])
        ? patient[field].join(", ")
        : patient[field];
      const label = fieldLabels[field] || field;
      const isRestricted = typeof value === "string" && value.startsWith("Restricted:");
      row.innerHTML = `<span class="field-label">${label}</span><span class="field-value${isRestricted ? " restricted" : ""}">${value}</span>`;
      sectionEl.appendChild(row);
    });

    patientDetail.appendChild(sectionEl);
  });
}

async function loadAuditLog() {
  const response = await fetch("/api/audit-log");
  const log = await response.json();
  renderAuditLog(log);
}

function renderAuditLog(log) {
  auditList.innerHTML = "";

  if (log.length === 0) {
    const li = document.createElement("li");
    li.classList.add("audit-empty");
    li.textContent = "No access recorded yet. Open a patient record to log an access.";
    auditList.appendChild(li);
    return;
  }

  log.forEach((entry) => {
    const li = document.createElement("li");
    li.classList.add("audit-entry");

    const time = new Date(entry.timestamp).toLocaleTimeString();
    const roleLabel = entry.role.charAt(0).toUpperCase() + entry.role.slice(1);

    const withheldParts = [];
    if (entry.omitted.length > 0) {
      withheldParts.push(`${entry.omitted.length} field${entry.omitted.length > 1 ? "s" : ""} omitted`);
    }
    if (entry.redacted.length > 0) {
      withheldParts.push(`${entry.redacted.length} redacted`);
    }
    const withheldText = withheldParts.length > 0
      ? withheldParts.join(", ")
      : "full access, nothing withheld";

    li.innerHTML = `
      <span class="audit-time">${time}</span>
      <span class="audit-detail"><strong>${roleLabel}</strong> viewed ${entry.patientName}</span>
      <span class="audit-withheld">${withheldText}</span>
    `;
    auditList.appendChild(li);
  });
}

roleSelect.addEventListener("change", loadPatients);

loadPatients();
loadAuditLog();
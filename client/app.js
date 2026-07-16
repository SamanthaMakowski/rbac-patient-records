const roleSelect = document.getElementById("role-select");
const patientList = document.getElementById("patient-list");
const patientDetail = document.getElementById("patient-detail");

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
}

function renderPatientDetail(patient) {
  patientDetail.classList.remove("empty");
  patientDetail.innerHTML = "";

  const fieldOrder = [
    "name", "dateOfBirth", "phone", "address", "appointment",
    "insurance", "ssn", "diagnosis", "medications", "clinicalNotes"
  ];

  fieldOrder.forEach((field) => {
    if (!(field in patient)) return;
    const row = document.createElement("div");
    row.classList.add("field-row");
    const value = Array.isArray(patient[field])
      ? patient[field].join(", ")
      : patient[field];
    const label = fieldLabels[field] || field;
    row.innerHTML = `<span class="field-label">${label}</span><span class="field-value">${value}</span>`;
    patientDetail.appendChild(row);
  });
}

roleSelect.addEventListener("change", loadPatients);

loadPatients();
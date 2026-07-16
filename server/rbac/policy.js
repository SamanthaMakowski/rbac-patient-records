const CLINICAL_FIELDS = ["diagnosis", "medications", "clinicalNotes"];
const REDACTED_FIELDS = ["ssn"];

const REDACTION_LABEL = "Restricted: not permitted for your role";

const ACCESS_MATRIX = {
  doctor: [
    "id", "name", "dateOfBirth", "phone", "address", "appointment",
    "diagnosis", "medications", "clinicalNotes"
  ],
  nurse: [
    "id", "name", "dateOfBirth", "phone", "address", "appointment",
    "diagnosis", "medications"
  ],
  receptionist: [
    "id", "name", "dateOfBirth", "phone", "address", "appointment",
    "insurance"
  ],
  admin: [
    "id", "name", "dateOfBirth", "phone", "address", "appointment",
    "insurance", "ssn"
  ]
};

function filterPatientForRole(patient, role) {
  const allowedFields = ACCESS_MATRIX[role];

  if (!allowedFields) {
    return {};
  }

  const filtered = {};

  for (const field of Object.keys(patient)) {
    if (allowedFields.includes(field)) {
      filtered[field] = patient[field];
    } else if (REDACTED_FIELDS.includes(field)) {
      filtered[field] = REDACTION_LABEL;
    }
  }

  return filtered;
}

module.exports = { filterPatientForRole };
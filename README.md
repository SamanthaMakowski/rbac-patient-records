# Role-Based Patient Records

A role based access control (RBAC) demo for healthcare records. The same patient chart shows different information depending on who's logged in, and the rules are enforced on the server, not in the browser.

This is the second project in a healthcare IT portfolio built around access control and compliance. It models the "who can see what" problem every EHR has to deal with, based on the HIPAA minimum necessary principle: you only get to see the information your job actually needs.


Repo: https://github.com/SamanthaMakowski/rbac-patient-records

## What it shows

Four roles: doctor, nurse, receptionist, admin. Pick one from the dropdown, open a patient, and the record changes based on that role. Fields you're not allowed to see are either dropped entirely or replaced with a restriction label. Every time a record is opened, it gets written to an audit log.

The access rules work out like this. Everyone sees the basics: name, date of birth, phone, address, and appointment. Insurance is visible to the receptionist and admin only. The SSN is redacted for everyone except the admin, who sees the real number. Diagnosis and medications are visible to the doctor and nurse. Clinical notes are doctor only.

No role sees everything, including admin. The doctor gets full clinical data but not the SSN. The admin gets the SSN but none of the clinical data. Access follows what the job needs, not rank.

Blocked fields get handled two ways. Clinical fields are dropped on the server, so they never reach the browser at all. The SSN gets redacted with a label instead, so you can actually see that something's being withheld on purpose.

## Server side enforcement

The filtering happens in policy.js on the server, before any data is sent to the browser. So when a receptionist opens a record, the clinical fields aren't just hidden on screen, they were never sent at all. You can confirm it in the network tab: the data a role isn't allowed to see simply isn't in the response. Unknown roles get an empty record instead of a full one, fail closed.

## Audit log

Every record access gets logged: who, when, and what was withheld. This is the HIPAA audit control idea, you have to be able to record and review who's touching PHI.

You can see it in the app under the Access Log panel (for example, Receptionist viewed Maria Gonzalez, 3 fields omitted, 1 redacted), or hit the /api/audit-log endpoint for the raw JSON.

## Structure

The client folder is the frontend: index.html, app.js, and styles.css. Plain HTML, CSS, and JavaScript, laid out as an EHR style chart.

The server folder is the backend. server.js is the Express server that serves the client, the API, and the audit log. Inside it, the rbac folder holds policy.js (the access matrix and filtering logic) and policy.test.js (tests for the access rules). The data folder holds patients.json (sample patients, shaped after the FHIR Patient resource).

Everything about access lives in policy.js, so the filtering, the audit reporting, and the tests all pull from the same rules. Change the matrix in one place and everything follows.

## Running it

Needs Node. Run npm install, then npm start, then open http://localhost:3000 in your browser.

Run the tests with npm test. They cover the stuff that matters: each role sees the right fields, only admin sees the SSN, unknown roles fail closed, and the audit reporting lines up with the actual rules.

## What's simplified

This is a demo meant to show the access control idea clearly, not a production system. 

Being straight about the gaps: Role comes from a dropdown. In a real system it'd be tied to your login, you badge in and it knows who you are. The dropdown is just so all four views are visible without four accounts. Real auth, a login that hands the server a signed token to verify, is the obvious next step in a full build.

Data is local JSON, shaped to look like a FHIR Patient resource but flattened so the access logic stays readable. A real version would pull from an actual FHIR API or database.

The audit log lives in memory and resets when the server restarts. In production it'd go to a database or a SIEM so the trail actually sticks around.

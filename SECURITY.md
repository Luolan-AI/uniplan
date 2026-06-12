# Security Policy

## Supported Version

UniPlan is currently an early-stage project. Security fixes are applied to the
latest version on the `main` branch.

## Reporting a Vulnerability

Please do not publish an exploitable security or privacy issue in a public issue.
Use GitHub's private vulnerability reporting feature when it is enabled for the
repository, or contact the repository owner privately.

Include:

- the affected version or commit;
- clear reproduction steps;
- the expected impact;
- whether user data can be exposed, modified, or lost;
- any suggested mitigation.

Do not include real student data, grades, exported plans, access tokens, or other
personal information in the report. Use synthetic sample data.

## Security Boundaries

UniPlan is a static, local-first application. It does not currently provide:

- server-side accounts or authentication;
- cloud storage or synchronization;
- encryption for exported JSON files;
- protection from another person who can access the same browser profile;
- validation that a community curriculum is officially correct or current.

Users are responsible for storing backups securely and reviewing imported files
before relying on them for academic decisions.

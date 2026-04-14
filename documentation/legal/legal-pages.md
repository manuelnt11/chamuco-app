# Legal Pages — Privacy Policy & Terms of Service

**Status:** Implemented (MVP)
**Last Updated:** 2026-04-13
**Applicable Law:** Ley 1581 de 2012 · Decreto 1074 de 2015 (Título 2, Cap. 25) · Ley 527 de 1999 · Ley 1480 de 2011

---

## Overview

Chamuco Travel is operated by a Colombian data controller and is therefore subject to Colombian data protection law (Habeas Data — Ley 1581 de 2012). Two public legal pages have been implemented:

| Page                 | URL                 | Accessible without auth |
| -------------------- | ------------------- | ----------------------- |
| Privacy Policy       | `/privacy-policy`   | Yes                     |
| Terms and Conditions | `/terms-of-service` | Yes                     |

Both pages are bilingual (Spanish / English), switch with the app language toggle, and render without nav chrome (logo + language/theme toggles only).

---

## Data Controller

| Field   | Value                                                       |
| ------- | ----------------------------------------------------------- |
| Name    | Manuel Nuñez Torres                                         |
| Type    | Persona natural domiciliada en Colombia                     |
| NIT     | Pending — must be updated to legal entity NIT before launch |
| Contact | admin@chamucotravel.com                                     |
| Brand   | Chamuco Travel                                              |
| Domain  | chamucotravel.com                                           |

---

## Privacy Policy — Section Summary

| Section                    | Key Obligation                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1. Data Controller         | Identity + contact (Art. 17, Ley 1581)                                                                              |
| 2. Data Collected          | 8 categories: account, profile, documents, **health (sensitive)**, emergency contacts, loyalty, activity, technical |
| 3. Purposes                | Listed exhaustively — principle of purpose limitation (Art. 4)                                                      |
| 4. Sensitive Data          | Explicit consent, voluntary, shared only with authorized organizers (Art. 5–6)                                      |
| 5. Third Parties           | Google/GCP + Meta/Facebook. No sale of data                                                                         |
| 6. International Transfers | Google SCCs — US servers (Art. 26)                                                                                  |
| 7. Minors                  | 18+ only. Account deletion if underage discovered                                                                   |
| 8. Retention               | Active account + 30-day grace on deletion, then permanent erasure                                                   |
| 9. Rights of Data Subject  | Access · Rectification · Erasure · Revocation · SIC complaint · Free access (Art. 8 + 22)                           |
| 10. Security               | HTTPS · Firebase token verification · GCP Secret Manager · RBAC · Immutable audit logs                              |
| 11. Organizer Export       | Consent given at trip join; organizer responsible for exported data                                                 |
| 12. Policy Changes         | 10-day notice before material changes                                                                               |
| 13. Contact & Complaints   | admin@chamucotravel.com · www.sic.gov.co                                                                            |

---

## Terms of Service — Section Summary

| Section                           | Key Clause                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| 1. Acceptance                     | Binding on registration                                                                |
| 2. Service                        | Group travel coordination, no real money processed                                     |
| 3. Eligibility                    | 18+ only                                                                               |
| 4. Account                        | Google / Facebook OAuth; username rules; credential responsibility                     |
| 5. Acceptable Use                 | 7 prohibited categories + consequence clause                                           |
| 6. Expense Module                 | Collaborative ledger only — no financial intermediation                                |
| 7. Intellectual Property          | Operator retains platform IP; user retains content ownership                           |
| 8. Gamification                   | No monetary value; no transfer; operator may adjust                                    |
| 9. Communications & Notifications | Consent to transactional + platform/promotional push notifications; no third-party ads |
| 10. Privacy                       | Reference to Privacy Policy; explicit consent for sensitive data                       |
| 11. Liability                     | Limited — 5 excluded categories + Colombian law caveat                                 |
| 12. Termination                   | 30-day recovery window; operator suspension rights                                     |
| 13. Modifications                 | 10-day notice before material changes                                                  |
| 14. Governing Law                 | Republic of Colombia; Bogotá D.C. courts; SIC jurisdiction                             |
| 15. Contact                       | admin@chamucotravel.com                                                                |

---

## Consent at Registration

The user must actively accept both documents before completing onboarding. This is implemented as a **mandatory checkbox** on the onboarding page (`/onboarding`) that links to both legal pages (opens in new tab). The submit button is disabled until the checkbox is checked.

**Implementation:** `apps/web/src/app/onboarding/page.tsx` — `termsAccepted` boolean state gates the submit button.

---

## Where Legal Links Should Appear

The following locations should display links to the Privacy Policy and/or Terms of Service. Items marked ✅ are already implemented; items marked ⬜ are pending.

### ✅ Implemented

| Location                         | Link(s) shown          | Notes                             |
| -------------------------------- | ---------------------- | --------------------------------- |
| Onboarding — acceptance checkbox | Privacy Policy + Terms | Required to complete registration |
| Privacy Policy page footer       | Terms and Conditions   | Cross-link                        |
| Terms of Service page footer     | Privacy Policy         | Cross-link                        |

### ⬜ Pending

| Location                               | Link(s) to add                             | Priority                                                              |
| -------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| Sign-in page footer                    | Privacy Policy + Terms                     | High — many regulatory frameworks require links before authentication |
| App footer / settings screen           | Privacy Policy + Terms                     | High — must be findable from within the app at all times              |
| Account deletion confirmation dialog   | Privacy Policy (data retention clause)     | Medium — user should know their data will be deleted per the policy   |
| Email notifications footer             | Privacy Policy + Terms                     | Medium — standard requirement for transactional and marketing emails  |
| Push notification opt-in prompt        | Privacy Policy                             | Medium — FCM consent notice                                           |
| App Store / Google Play listing        | Privacy Policy URL                         | High — required by both Apple App Store and Google Play policies      |
| Onboarding — health data fields        | Privacy Policy (Section 4, sensitive data) | Medium — contextual notice when collecting sensitive data             |
| Organizer "Export participants" action | Privacy Policy (Section 11)                | Medium — remind organizer of their responsibilities at export time    |

---

## Regulatory Compliance Checklist

### Before Launch (Mandatory)

- [ ] **Update Data Controller identity** — replace "persona natural" with the registered legal entity name and NIT once the company is constituted.
- [ ] **Register databases with SIC (RNBD)** — _Registro Nacional de Bases de Datos_ is mandatory for companies with more than 5 employees. Register at [www.sic.gov.co](https://www.sic.gov.co) before scaling.
- [ ] **Add legal links to sign-in page** — required to be accessible before authentication.
- [ ] **Add legal links to app footer / settings** — must be reachable from within the authenticated app at all times (Art. 15, Ley 1581).
- [ ] **Add Privacy Policy URL to App Store and Google Play listings** — both stores require it for apps that collect personal data.

### Before Adding New Data Categories

- [ ] Update Section 2 of the Privacy Policy for any new data category collected.
- [ ] If the new data is sensitive (health, biometric, financial), update Section 4 and add explicit consent UI.
- [ ] Re-evaluate international transfer obligations if new third-party processors are added.

### Periodic Reviews

- [ ] **Annual review** of the Privacy Policy and Terms of Service for changes in Colombian regulations.
- [ ] **After any significant feature launch** that involves new data processing (messaging, payments, etc.).

---

## Response Time Obligations (Ley 1581, Art. 22)

| Request type                                          | Legal deadline                                   |
| ----------------------------------------------------- | ------------------------------------------------ |
| Consulta (data access query)                          | 10 business days (extendable 5 more with notice) |
| Reclamación (claim: correction, deletion, revocation) | 15 business days (extendable 8 more with notice) |

All incoming requests to admin@chamucotravel.com related to personal data must be logged with receipt date to track these deadlines.

---

## Implementation Files

| File                                               | Purpose                          |
| -------------------------------------------------- | -------------------------------- |
| `apps/web/src/app/privacy-policy/page.tsx`         | Privacy Policy page component    |
| `apps/web/src/app/terms-of-service/page.tsx`       | Terms of Service page component  |
| `apps/web/src/app/onboarding/page.tsx`             | Checkbox consent at registration |
| `apps/web/src/locales/en.json` → `legal` namespace | English legal text               |
| `apps/web/src/locales/es.json` → `legal` namespace | Spanish legal text               |
| `apps/web/src/middleware.ts`                       | Public access for legal routes   |
| `apps/web/src/components/layout/AppShell.tsx`      | No nav chrome on legal pages     |

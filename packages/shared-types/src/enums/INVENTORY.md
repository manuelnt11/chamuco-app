# Inventory: enums

---

## app-currency.enum.ts

### Imports

- none

### Definitions

- AppCurrency (enum) — Supported app currencies: COP, USD

### Exports

- AppCurrency — named

---

## app-language.enum.ts

### Imports

- none

### Definitions

- AppLanguage (enum) — Supported app UI languages: ES, EN

### Exports

- AppLanguage — named

---

## app-theme.enum.ts

### Imports

- none

### Definitions

- AppTheme (enum) — UI theme options: LIGHT, DARK, SYSTEM

### Exports

- AppTheme — named

---

## auth-provider.enum.ts

### Imports

- none

### Definitions

- AuthProvider (enum) — Supported Firebase authentication providers: GOOGLE, FACEBOOK

### Exports

- AuthProvider — named

---

## blood-type.enum.ts

### Imports

- none

### Definitions

- BloodType (enum) — ABO/Rh blood group variants (8 values: A/B/AB/O ± positive/negative)

### Exports

- BloodType — named

---

## delivery-status.enum.ts

### Imports

- none

### Definitions

- DeliveryStatus (enum) — Notification delivery lifecycle: PENDING, SENT, FAILED

### Exports

- DeliveryStatus — named

---

## dietary-preference.enum.ts

### Imports

- none

### Definitions

- DietaryPreference (enum) — Dietary regimes for health profile: OMNIVORE, VEGETARIAN, VEGAN, PESCATARIAN, GLUTEN_FREE, OTHER

### Exports

- DietaryPreference — named

---

## document-status.enum.ts

### Imports

- none

### Definitions

- DocumentStatus (enum) — Validity state for travel documents (passport, visa, ETA): ACTIVE, EXPIRING_SOON, EXPIRED

### Exports

- DocumentStatus — named

---

## eta-type.enum.ts

### Imports

- none

### Definitions

- EtaType (enum) — Electronic travel authorization categories: TOURIST, TRANSIT

### Exports

- EtaType — named

---

## export-field.enum.ts

### Imports

- none

### Definitions

- ExportField (enum) — Participant data columns available for trip roster exports (24 fields covering identity, travel docs, health, and participation metadata)

### Exports

- ExportField — named

---

## export-format.enum.ts

### Imports

- none

### Definitions

- ExportFormat (enum) — File formats for roster exports: csv, xlsx, ods

### Exports

- ExportFormat — named

---

## food-allergen.enum.ts

### Imports

- none

### Definitions

- FoodAllergen (enum) — EU-14 regulated allergens plus OTHER (15 values)

### Exports

- FoodAllergen — named

---

## group-member-status.enum.ts

### Imports

- none

### Definitions

- GroupMemberStatus (enum) — Lifecycle states for a user's membership in a group: REQUEST, INVITED, ACTIVE, REJECTED, REMOVED, LEFT

### Exports

- GroupMemberStatus — named

---

## group-member-tier.enum.ts

### Imports

- none

### Definitions

- GroupMemberTier (enum) — Gamification tier for group participation: NEWCOMER, NOVICE, EXPLORER, VETERAN

### Exports

- GroupMemberTier — named

---

## group-role.enum.ts

### Imports

- none

### Definitions

- GroupRole (enum) — Permission levels within a group: OWNER, ADMIN, MEMBER

### Exports

- GroupRole — named

---

## group-visibility.enum.ts

### Imports

- none

### Definitions

- GroupVisibility (enum) — Group discoverability: PUBLIC, PRIVATE

### Exports

- GroupVisibility — named

---

## index.ts

### Imports

- none

### Definitions

- none (barrel file only)

### Exports

- ./app-currency.enum — barrel re-export
- ./app-language.enum — barrel re-export
- ./app-theme.enum — barrel re-export
- ./auth-provider.enum — barrel re-export
- ./blood-type.enum — barrel re-export
- ./delivery-status.enum — barrel re-export
- ./dietary-preference.enum — barrel re-export
- ./document-status.enum — barrel re-export
- ./eta-type.enum — barrel re-export
- ./export-field.enum — barrel re-export
- ./export-format.enum — barrel re-export
- ./food-allergen.enum — barrel re-export
- ./group-member-status.enum — barrel re-export
- ./invitation-token-context.enum — barrel re-export
- ./group-member-tier.enum — barrel re-export
- ./group-role.enum — barrel re-export
- ./group-visibility.enum — barrel re-export
- ./medical-condition-type.enum — barrel re-export
- ./notification-channel.enum — barrel re-export
- ./notification-type.enum — barrel re-export
- ./passport-status.enum — barrel re-export
- ./phobia-type.enum — barrel re-export
- ./physical-limitation-type.enum — barrel re-export
- ./platform-role.enum — barrel re-export
- ./profile-visibility.enum — barrel re-export
- ./transient-message-type.enum — barrel re-export
- ./trip-participant-status.enum — barrel re-export
- ./trip-role.enum — barrel re-export
- ./trip-status.enum — barrel re-export
- ./trip-visibility.enum — barrel re-export
- ./upload-type.enum — barrel re-export
- ./visa-coverage-type.enum — barrel re-export
- ./visa-entries.enum — barrel re-export
- ./visa-type.enum — barrel re-export
- ./visa-zone.enum — barrel re-export

---

## invitation-token-context.enum.ts

### Imports

- none

### Definitions

- InvitationTokenContext (enum) — Scope of a shareable invitation token: referral, trip, group

### Exports

- InvitationTokenContext — named

---

## medical-condition-type.enum.ts

### Imports

- none

### Definitions

- MedicalConditionType (enum) — Declared medical conditions for user health profile (9 values including DIABETES, EPILEPSY, ASTHMA, OTHER)

### Exports

- MedicalConditionType — named

---

## notification-channel.enum.ts

### Imports

- none

### Definitions

- NotificationChannel (enum) — Delivery channels for notifications: PUSH, EMAIL, SMS

### Exports

- NotificationChannel — named

---

## notification-type.enum.ts

### Imports

- none

### Definitions

- NotificationType (enum) — All in-app/push notification event types (18 values covering group, trip, passport, and achievement events)

### Exports

- NotificationType — named

---

## notifications.enums.test.ts

### Imports

- vitest — describe, it, expect (test runner)
- ./notification-type.enum — NotificationType
- ./notification-channel.enum — NotificationChannel
- ./delivery-status.enum — DeliveryStatus
- ./index — barrel (validates all three enums are re-exported)

### Definitions

- NotificationType test suite — verifies all 18 members and barrel export
- NotificationChannel test suite — verifies all 3 members and barrel export
- DeliveryStatus test suite — verifies all 3 members and barrel export

### Exports

- none (test file)

---

## passport-status.enum.ts

### Imports

- none

### Definitions

- PassportStatus (enum) — Validity state specific to passports: OMITTED, ACTIVE, EXPIRING_SOON, EXPIRED

### Exports

- PassportStatus — named

---

## phobia-type.enum.ts

### Imports

- none

### Definitions

- PhobiaType (enum) — Declared travel-relevant phobias for health profile (13 values including HEIGHTS, FLYING, CROWDS, OTHER)

### Exports

- PhobiaType — named

---

## physical-limitation-type.enum.ts

### Imports

- none

### Definitions

- PhysicalLimitationType (enum) — Declared physical limitations for health profile (13 values including WHEELCHAIR_USER, VISUAL_IMPAIRMENT, PREGNANCY, OTHER)

### Exports

- PhysicalLimitationType — named

---

## platform-role.enum.ts

### Imports

- none

### Definitions

- PlatformRole (enum) — System-wide user roles: USER, SUPPORT_ADMIN

### Exports

- PlatformRole — named

---

## profile-visibility.enum.ts

### Imports

- none

### Definitions

- ProfileVisibility (enum) — Who can view a user profile: PRIVATE, CONNECTIONS_ONLY, MEMBERS_ONLY, PUBLIC

### Exports

- ProfileVisibility — named

---

## transient-message-type.enum.ts

### Imports

- none

### Definitions

- TransientMessageType (enum) — Categories of short-lived transactional messages: EMAIL_VERIFICATION, PHONE_VERIFICATION, WELCOME_EMAIL

### Exports

- TransientMessageType — named

---

## trip-participant-status.enum.ts

### Imports

- none

### Definitions

- TripParticipantStatus (enum) — Lifecycle states for a user's participation in a trip: INVITED, PENDING_REQUEST, ACCEPTED, CONFIRMED, DECLINED

### Exports

- TripParticipantStatus — named

---

## trip-role.enum.ts

### Imports

- none

### Definitions

- TripRole (enum) — Permission roles within a trip: ORGANIZER, CO_ORGANIZER, PARTICIPANT

### Exports

- TripRole — named

---

## trip-status.enum.ts

### Imports

- none

### Definitions

- TripStatus (enum) — Trip lifecycle stages: DRAFT, OPEN, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED

### Exports

- TripStatus — named

---

## trip-visibility.enum.ts

### Imports

- none

### Definitions

- TripVisibility (enum) — Trip discoverability: PUBLIC, PRIVATE

### Exports

- TripVisibility — named

---

## upload-type.enum.ts

### Imports

- none

### Definitions

- UploadType (enum) — Asset upload categories that drive storage path, MIME validation, and authorization: USER_AVATAR, GROUP_COVER, GROUP_RESOURCE_DOCUMENT, TRIP_COVER, TRIP_RESOURCE

### Exports

- UploadType — named

---

## visa-coverage-type.enum.ts

### Imports

- none

### Definitions

- VisaCoverageType (enum) — Whether a visa covers a single country or a multi-country zone: COUNTRY, ZONE

### Exports

- VisaCoverageType — named

---

## visa-entries.enum.ts

### Imports

- none

### Definitions

- VisaEntries (enum) — Number of allowed entries on a visa: SINGLE, DOUBLE, MULTIPLE

### Exports

- VisaEntries — named

---

## visa-type.enum.ts

### Imports

- none

### Definitions

- VisaType (enum) — Visa purpose categories: TOURIST, BUSINESS, TRANSIT, WORK, STUDENT, DIGITAL_NOMAD, OTHER

### Exports

- VisaType — named

---

## visa-zone.enum.ts

### Imports

- none

### Definitions

- VisaZone (enum) — Multi-country travel zones recognized for visa coverage: SCHENGEN, GCC, CARICOM, EAC, CAN, MERCOSUR, ECOWAS

### Exports

- VisaZone — named

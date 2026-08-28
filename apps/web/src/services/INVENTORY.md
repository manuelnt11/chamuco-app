# Inventory: services

---

## api-client.ts

### Imports

- `axios` — `axios` (default, used to create the instance), `AxiosRequestConfig`, `InternalAxiosRequestConfig`

### Definitions

- `TokenProvider` (type) — function signature `(forceRefresh?: boolean) => Promise<string | null>` for token getters
- `tokenProvider` (const) — module-level singleton holding the registered token provider; starts as `null`
- `RetryableRequestConfig` (interface) — extends `InternalAxiosRequestConfig` with optional `_retry` flag to prevent infinite retry loops
- `setTokenProvider` (function) — registers a `TokenProvider` on the module singleton so interceptors can attach Bearer tokens
- `apiClient` (const) — Axios instance with `NEXT_PUBLIC_API_URL` as `baseURL`; request interceptor attaches `Authorization: Bearer <token>`; response interceptor retries once on 401 with a force-refreshed token

### Exports

- `setTokenProvider` — named
- `apiClient` — named

---

## api-client.test.ts

### Imports

- `./api-client` — `apiClient`, `setTokenProvider`

### Definitions

- (test file — no exportable definitions; Vitest `describe` suites cover `setTokenProvider`, request interceptor, and response interceptor behavior)

### Exports

- (none)

---

## auth.service.ts

### Imports

- `@/services/api-client` — `apiClient`
- `@/services/auth.types` — `RegisterPayload`

### Definitions

- `register` (function) — POST `/v1/auth/register` with a `RegisterPayload`; returns `void`
- `logout` (function) — POST `/v1/auth/logout`; returns `void`
- `checkMe` (function) — GET `/v1/users/me`; returns `void` (used to verify token validity)

### Exports

- `register` — named
- `logout` — named
- `checkMe` — named

---

## auth.service.test.ts

### Imports

- `./auth.service` — `checkMe`, `logout`, `register`
- `@/services/auth.types` — `RegisterPayload`

### Definitions

- (test file — Vitest suites for `register`, `logout`, `checkMe`)

### Exports

- (none)

---

## auth.types.ts

### Imports

- `@chamuco/shared-types` — `DateOfBirth`

### Definitions

- `RegisterPayload` (interface) — all fields required to create a new user account (username, displayName, firstName, lastName, dateOfBirth, homeCountry, homeCity, phone, email, timezone)

### Exports

- `RegisterPayload` — named

---

## feedback.service.ts

### Imports

- `@/services/api-client` — `apiClient`
- `@chamuco/shared-types` — `FeedbackResponse`
- `@/services/feedback.types` — `FeedbackPayload`

### Definitions

- `submitFeedback` (function) — POST `/v1/feedback` with a `FeedbackPayload`; returns `FeedbackResponse`

### Exports

- `submitFeedback` — named

---

## feedback.service.test.ts

### Imports

- `./feedback.service` — `submitFeedback`
- `@chamuco/shared-types` — `FeedbackResponse`
- `@/services/feedback.types` — `FeedbackPayload`

### Definitions

- (test file — Vitest suite for `submitFeedback`)

### Exports

- (none)

---

## feedback.types.ts

### Imports

- (none)

### Definitions

- `FeedbackPayload` (interface) — in-app feedback fields: `comment`, `currentPage`, `userAgent`, `viewportSize`, `language`, `theme`

### Exports

- `FeedbackPayload` — named

---

## gcs-upload.ts

### Imports

- (none — uses browser `XMLHttpRequest` global)

### Definitions

- `UPLOAD_TIMEOUT_MS` (const) — 5-minute timeout in milliseconds; triggers `xhr.abort()` if upload hangs
- `uploadToGcs` (function) — performs a direct PUT to a GCS signed URL via XHR; fires `onProgress` callbacks with percentage (0–99); rejects on network error, non-2xx status, abort, or 5-minute timeout

### Exports

- `uploadToGcs` — named

---

## gcs-upload.test.ts

### Imports

- `vitest` — `vi`, `describe`, `it`, `expect`, `beforeEach`, `afterEach`
- `./gcs-upload` — `uploadToGcs`

### Definitions

- `makeXhr` (function) — test helper (~37 lines); builds a fake `XMLHttpRequest` stub with `fire`/`fireUpload` methods and installs it as `global.XMLHttpRequest`

### Exports

- (none)

---

## groups.service.ts

### Imports

- `@/services/api-client` — `apiClient`
- `@/services/groups.types` — `CreateGroupPayload`, `GroupMembershipResponse`, `UpdateGroupPayload`
- `@chamuco/shared-types` — `BulkInvitationResponse`, `GroupRole`
- `@/types/group` — `Group`, `GroupAnnouncement`, `GroupAnnouncementsResponse`, `GroupInvitation`, `GroupMember`, `GroupSearchResponse`, `PendingGroupMember`

### Definitions

- `getGroups` (function) — GET `/v1/groups`; returns `Group[]`
- `getGroup` (function) — GET `/v1/groups/:id`; returns `Group`
- `createGroup` (function) — POST `/v1/groups`; returns `Group`
- `updateGroup` (function) — PATCH `/v1/groups/:id`; returns `Group`
- `deleteGroup` (function) — DELETE `/v1/groups/:id`
- `getGroupMembers` (function) — GET `/v1/groups/:id/members`; returns `GroupMember[]`
- `getGroupMembership` (function) — GET `/v1/groups/:id/members/me`; returns `GroupMembershipResponse`
- `updateMemberRole` (function) — PATCH `/v1/groups/:groupId/members/:userId/role`
- `removeGroupMember` (function) — DELETE `/v1/groups/:groupId/members/:userId`
- `joinGroup` (function) — POST `/v1/groups/:groupId/join-request`
- `leaveGroup` (function) — DELETE `/v1/groups/:groupId/members/:userId`
- `acceptJoinRequest` (function) — PATCH `/v1/groups/:groupId/join-requests/:userId/accept`
- `rejectJoinRequest` (function) — PATCH `/v1/groups/:groupId/join-requests/:userId/reject`
- `getMyGroupInvitations` (function) — GET `/v1/groups/invitations`; returns `GroupInvitation[]`
- `inviteGroupMembers` (function) — POST `/v1/groups/:groupId/invitations`; returns `BulkInvitationResponse`
- `acceptGroupInvitation` (function) — PATCH `/v1/groups/:groupId/invitations/accept`
- `declineGroupInvitation` (function) — PATCH `/v1/groups/:groupId/invitations/decline`
- `cancelGroupInvitation` (function) — DELETE `/v1/groups/:groupId/invitations/:userId`
- `getGroupAnnouncements` (function) — GET `/v1/groups/:groupId/announcements` with pagination; returns `GroupAnnouncementsResponse`
- `getGroupAnnouncement` (function) — GET `/v1/groups/:groupId/announcements/:announcementId`; returns `GroupAnnouncement`
- `createAnnouncement` (function) — POST `/v1/groups/:groupId/announcements`; returns `GroupAnnouncement`
- `updateAnnouncement` (function) — PATCH `/v1/groups/:groupId/announcements/:announcementId`; returns `GroupAnnouncement`
- `deleteAnnouncement` (function) — DELETE `/v1/groups/:groupId/announcements/:announcementId`
- `getPendingGroupMembers` (function) — GET `/v1/groups/:groupId/pending`; returns `PendingGroupMember[]`
- `searchGroups` (function) — GET `/v1/groups/search` with query params and optional `AbortSignal`; returns `GroupSearchResponse`

### Exports

- All 25 functions above — named

---

## groups.service.test.ts

### Imports

- `./groups.service` — all 25 service functions
- `@/services/groups.types` — `CreateGroupPayload`, `GroupMembershipResponse`, `UpdateGroupPayload`
- `@/types/group` — `Group`, `GroupAnnouncement`, `GroupAnnouncementsResponse`, `GroupInvitation`, `GroupMember`, `GroupSearchResponse`, `PendingGroupMember`
- `@chamuco/shared-types` — `BulkInvitationResponse`, `GroupMemberStatus`, `GroupMemberTier`, `GroupRole`, `GroupVisibility`, `MembershipStatus`

### Definitions

- (test file — Vitest suites for all group service functions)

### Exports

- (none)

---

## groups.types.ts

### Imports

- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `GroupVisibility`

### Definitions

- `CreateGroupPayload` (interface) — payload for POST `/v1/groups` (name, description, visibility, cover)
- `UpdateGroupPayload` (interface) — partial update payload for PATCH `/v1/groups/:id`
- `GroupMembershipResponse` (interface) — response shape for GET `/v1/groups/:id/members/me` (status, role)

### Exports

- `CreateGroupPayload` — named
- `UpdateGroupPayload` — named
- `GroupMembershipResponse` — named

---

## invitation-tokens.service.ts

### Imports

- `axios` — `isAxiosError`
- `@/services/api-client` — `apiClient`
- `@chamuco/shared-types` — `InvitationTokenCreateResponse`, `InvitationTokenRedeemResponse`, `InvitationTokenResolveResponse`, `InvitationTokenContext`
- `@/services/invitation-tokens.types` — `CreateInvitationTokenPayload`

### Definitions

- `createInvitationToken` (function) — POST `/v1/invitation-tokens`; returns `InvitationTokenCreateResponse`
- `resolveInvitationToken` (function) — GET `/v1/invitation-tokens/:token`; returns `InvitationTokenResolveResponse`
- `redeemInvitationToken` (function) — POST `/v1/invitation-tokens/:token/redeem`; returns `InvitationTokenRedeemResponse`
- `toggleInvitationToken` (function) — PATCH `/v1/invitation-tokens/:token/toggle`; returns `void`
- `getOpenInvitationToken` (function) — GET `/v1/invitation-tokens/open`; returns `InvitationTokenCreateResponse | null` (null on 404, rethrows other errors)

### Exports

- `createInvitationToken` — named
- `resolveInvitationToken` — named
- `redeemInvitationToken` — named
- `toggleInvitationToken` — named
- `getOpenInvitationToken` — named

---

## invitation-tokens.service.test.ts

### Imports

- `vitest` — `describe`, `it`, `expect`, `beforeEach`, `vi`
- `./invitation-tokens.service` — `createInvitationToken`, `getOpenInvitationToken`, `resolveInvitationToken`, `redeemInvitationToken`, `toggleInvitationToken`
- `@chamuco/shared-types` — `InvitationTokenCreateResponse`, `InvitationTokenResolveResponse`, `InvitationTokenContext`

### Definitions

- (test file — Vitest suites for all invitation-token service functions)

### Exports

- (none)

---

## invitation-tokens.types.ts

### Imports

- `@chamuco/shared-types` — `InvitationTokenContext`

### Definitions

- `CreateInvitationTokenPayload` (interface) — payload for POST `/v1/invitation-tokens` (contextType, optional contextId, recipientEmail, note)

### Exports

- `CreateInvitationTokenPayload` — named

---

## notifications.service.ts

### Imports

- `@/services/api-client` — `apiClient`
- `@chamuco/shared-types` — `NotificationsPage`

### Definitions

- `getNotifications` (function) — GET `/v1/notifications` with optional `limit` and `AbortSignal`; returns `NotificationsPage`
- `markNotificationRead` (function) — PATCH `/v1/notifications/:id/read`
- `markAllNotificationsRead` (function) — PATCH `/v1/notifications/read-all`
- `registerFcmToken` (function) — POST `/v1/notifications/fcm-token` with the FCM device token
- `unregisterFcmToken` (function) — DELETE `/v1/notifications/fcm-token` with the FCM token in the request body

### Exports

- `getNotifications` — named
- `markNotificationRead` — named
- `markAllNotificationsRead` — named
- `registerFcmToken` — named
- `unregisterFcmToken` — named

---

## notifications.service.test.ts

### Imports

- `./notifications.service` — `getNotifications`, `markAllNotificationsRead`, `markNotificationRead`, `registerFcmToken`, `unregisterFcmToken`
- `@chamuco/shared-types` — `NotificationItem`, `NotificationsPage`, `NotificationType`

### Definitions

- (test file — Vitest suites for all notification service functions)

### Exports

- (none)

---

## places.service.ts

### Imports

- `@/services/api-client` — `apiClient`
- `@chamuco/shared-types` — `CityResult`

### Definitions

- `searchCities` (function) — GET `/v1/locations/cities` with `country` and `namePrefix` query params and optional `AbortSignal`; returns `CityResult[]`

### Exports

- `searchCities` — named

---

## places.service.test.ts

### Imports

- `./places.service` — `searchCities`
- `@chamuco/shared-types` — `CityResult`

### Definitions

- (test file — Vitest suite for `searchCities`)

### Exports

- (none)

---

## trips.service.ts

### Imports

- `@chamuco/shared-types` — `BulkInvitationResponse`, `ExportField`, `ExportFormat`
- `@/services/api-client` — `apiClient`
- `@/services/trips.types` — `AddTripGroupPayload`, `CreateDestinationPayload`, `CreateTripInvitationPayload`, `CreateTripPayload`, `CreateTripTaskPayload`, `DestinationResponse`, `DestinationWriteResponse`, `MyTripInvitationResponse`, `MyTripListItemResponse`, `MyTripParticipationResponse`, `PendingTripParticipantResponse`, `ReorderDestinationsPayload`, `SearchTripsParams`, `SetTripTaskCompletionPayload`, `TransitionTripStatusPayload`, `TripAnnouncement`, `TripAnnouncementPayload`, `TripAnnouncementsResponse`, `TripGroupResponse`, `TripLinkedGroup`, `TripParticipantResponse`, `TripResponse`, `TripSearchResponse`, `TripTask`, `UpdateDestinationPayload`, `UpdateParticipantRolePayload`, `UpdateTripPayload`, `UpdateTripTaskPayload`

### Definitions

- `downloadBlob` (function) — private; creates an object URL for a `Blob` and clicks a synthetic `<a download>` to trigger a browser download, then revokes the URL. Shared by `exportTripParticipants` and `exportTripItineraryPdf`.
- `searchTrips` (function) — GET `/v1/trips/search` with `SearchTripsParams` and optional `AbortSignal`
- `getMyTrips` (function) — GET `/v1/trips`; returns `MyTripListItemResponse[]`
- `createTrip` (function) — POST `/v1/trips`; returns `TripResponse`
- `getTrip` (function) — GET `/v1/trips/:id`; returns `TripResponse`
- `updateTrip` (function) — PATCH `/v1/trips/:id`; returns `TripResponse`
- `deleteTrip` (function) — DELETE `/v1/trips/:id`
- `transitionTripStatus` (function) — PATCH `/v1/trips/:id/status`; returns `TripResponse`
- `getTripParticipation` (function) — GET `/v1/trips/:id/participants/me`; returns `MyTripParticipationResponse`
- `getTripDestinations` (function) — GET `/v1/trips/:id/destinations`; returns `DestinationResponse[]`
- `addTripDestination` (function) — POST `/v1/trips/:id/destinations`; returns `DestinationWriteResponse`
- `reorderTripDestinations` (function) — PATCH `/v1/trips/:id/destinations/reorder`; returns `DestinationResponse[]`
- `updateTripDestination` (function) — PATCH `/v1/trips/:id/destinations/:destId`; returns `DestinationWriteResponse`
- `deleteTripDestination` (function) — DELETE `/v1/trips/:id/destinations/:destId`
- `getTripParticipants` (function) — GET `/v1/trips/:id/participants`; returns `TripParticipantResponse[]`
- `getPendingTripParticipants` (function) — GET `/v1/trips/:id/participants/pending`; returns `PendingTripParticipantResponse[]`
- `updateTripParticipantRole` (function) — PATCH `/v1/trips/:id/participants/:userId/role`
- `removeTripParticipant` (function) — DELETE `/v1/trips/:id/participants/:userId`
- `exportTripParticipants` (function) — GET participants export as blob, triggers browser download in csv/xlsx/ods
- `exportTripItineraryPdf` (function) — GET `/v1/trips/:id/itinerary/pdf` as blob, triggers browser download of `itinerary-:id.pdf`
- `getMyTripInvitations` (function) — GET `/v1/trips/invitations`; returns `MyTripInvitationResponse[]`
- `inviteTripParticipants` (function) — POST `/v1/trips/:id/invitations`; returns `BulkInvitationResponse`
- `acceptTripInvitation` (function) — PATCH `/v1/trips/:id/invitations/accept`
- `declineTripInvitation` (function) — PATCH `/v1/trips/:id/invitations/decline`
- `revokeTripInvitation` (function) — DELETE `/v1/trips/:id/invitations/:userId`
- `submitJoinRequest` (function) — POST `/v1/trips/:id/join-request`
- `withdrawJoinRequest` (function) — DELETE `/v1/trips/:id/join-request`
- `toggleTripParticipantConfirmation` (function) — PATCH `/v1/trips/:id/participants/:userId/confirmation`
- `acceptJoinRequest` (function) — PATCH `/v1/trips/:id/join-requests/:userId/accept`
- `rejectJoinRequest` (function) — PATCH `/v1/trips/:id/join-requests/:userId/reject`
- `getTripGroups` (function) — GET `/v1/trips/:id/groups`; returns `TripGroupResponse[]`
- `getTripLinkedGroups` (function) — GET `/v1/trips/:id/linked-groups`; returns `TripLinkedGroup[]`
- `addTripGroup` (function) — POST `/v1/trips/:id/groups`; returns `TripGroupResponse`
- `removeTripGroup` (function) — DELETE `/v1/trips/:id/groups/:groupId`
- `getTripAnnouncements` (function) — GET `/v1/trips/:tripId/announcements` with pagination; returns `TripAnnouncementsResponse`
- `getTripAnnouncement` (function) — GET `/v1/trips/:tripId/announcements/:announcementId`; returns `TripAnnouncement`
- `createTripAnnouncement` (function) — POST `/v1/trips/:tripId/announcements`; returns `TripAnnouncement`
- `updateTripAnnouncement` (function) — PATCH `/v1/trips/:tripId/announcements/:announcementId`; returns `TripAnnouncement`
- `deleteTripAnnouncement` (function) — DELETE `/v1/trips/:tripId/announcements/:announcementId`
- `getTripTasks` (function) — GET `/v1/trips/:tripId/tasks`; returns `TripTask[]`
- `createTripTask` (function) — POST `/v1/trips/:tripId/tasks`; returns `TripTask`
- `updateTripTaskTitle` (function) — PATCH `/v1/trips/:tripId/tasks/:taskId`; returns `TripTask`
- `setTripTaskCompletion` (function) — PATCH `/v1/trips/:tripId/tasks/:taskId/completion`; returns `TripTask`
- `deleteTripTask` (function) — DELETE `/v1/trips/:tripId/tasks/:taskId`

### Exports

- All 42 functions above — named

---

## trips.service.test.ts

### Imports

- `./trips.service` — 25 trip service functions (subset of the full API tested here)
- `@/services/trips.types` — response and payload types
- `@chamuco/shared-types` — `TripRole`, `TripStatus`, `TripTaskScope`, `TripVisibility`

### Definitions

- (test file — Vitest suites for trip CRUD, destinations, groups, search, announcement, and task functions)

### Exports

- (none)

---

## trips.types.ts

### Imports

- `@chamuco/shared-types` — `MembershipStatus`, `TripParticipantStatus`, `TripRole`, `TripStatus`, `TripTaskScope`, `TripVisibility`

### Definitions

- `CoverPayload` (interface) — shared cover shape (source: `'emoji' | 'gcs'`, target, optional fileSize); non-exported
- `CreateTripPayload` (interface) — full payload for POST `/v1/trips`
- `UpdateTripPayload` (interface) — partial update payload for PATCH `/v1/trips/:id`
- `TransitionTripStatusPayload` (interface) — payload for PATCH `/v1/trips/:id/status`
- `CreateDestinationPayload` (interface) — payload to add a trip destination; includes optional `itinerary` Markdown string
- `UpdateDestinationPayload` (interface) — partial update for a trip destination; includes optional `itinerary` Markdown string
- `ReorderDestinationsPayload` (interface) — ordered list of destination IDs for reorder endpoint
- `AddTripGroupPayload` (interface) — payload to link a group to a trip
- `TripResponse` (interface) — full trip record returned by the API
- `MyTripListItemResponse` (interface) — extends `TripResponse` with `confirmedParticipantCount` and `userRole`
- `DestinationResponse` (interface) — trip destination record; includes `itinerary: string | null`
- `DestinationWriteResponse` (interface) — extends `DestinationResponse` with `requiresConfirmation`
- `TripGroupResponse` (interface) — trip-group link record
- `TripLinkedGroup` (interface) — minimal group info for display in a trip context
- `TripParticipantResponse` (interface) — accepted/confirmed participant record
- `PendingTripParticipantResponse` (interface) — invited/pending-request participant record
- `MyTripParticipationResponse` (interface) — current user's participation status, role, and traveler flag
- `UpdateParticipantRolePayload` (interface) — payload to change a participant's role
- `CreateTripInvitationPayload` (interface) — bulk invitation payload (list of usernames)
- `TripAnnouncement` (interface) — announcement record with content and authorship
- `TripAnnouncementsResponse` (interface) — paginated list of `TripAnnouncement`
- `TripAnnouncementPayload` (interface) — payload for create/update announcement
- `TripSearchDestination` (interface) — city/country pair used in search results
- `TripSearchResult` (interface) — trip record returned by the search endpoint
- `TripSearchResponse` (interface) — paginated search result wrapper
- `SearchTripsParams` (interface) — optional query params for trip search (q, limit, offset)
- `MyTripInvitationResponse` (interface) — pending trip invitation visible to the invited user
- `TripTask` (interface) — trip task record; `scope` (SHARED/PERSONAL), `completed` resolved for the requesting user, `ownerId` null for SHARED
- `CreateTripTaskPayload` (interface) — payload for create task (scope + title)
- `UpdateTripTaskPayload` (interface) — payload to rename a task (title)
- `SetTripTaskCompletionPayload` (interface) — payload to toggle a task's completion state

### Exports

- All interfaces except `CoverPayload` — named

---

## uploads.service.ts

### Imports

- `@/services/api-client` — `apiClient`
- `@chamuco/shared-types` — `SignedUrlResponse`
- `@/services/uploads.types` — `GetSignedUrlPayload`

### Definitions

- `getSignedUrl` (function) — POST `/v1/uploads/signed-url`; returns a GCS signed URL, object key, and expiry for direct-to-GCS uploads

### Exports

- `getSignedUrl` — named

---

## uploads.service.test.ts

### Imports

- `./uploads.service` — `getSignedUrl`
- `@chamuco/shared-types` — `SignedUrlResponse`, `UploadType`
- `@/services/uploads.types` — `GetSignedUrlPayload`

### Definitions

- (test file — Vitest suite for `getSignedUrl`)

### Exports

- (none)

---

## uploads.types.ts

### Imports

- `@chamuco/shared-types` — `UploadType`

### Definitions

- `GetSignedUrlPayload` (interface) — payload for POST `/v1/uploads/signed-url` (uploadType, contextId, contentType, fileSize)

### Exports

- `GetSignedUrlPayload` — named

---

## users.service.ts

### Imports

- `@/services/api-client` — `apiClient`
- `@/store/user` — `AppUser`
- `@/types/user` — `UserSearchResponse`
- `@/services/users.types` — `CreateEmergencyContactPayload`, `CreateEtaPayload`, `CreateLoyaltyProgramPayload`, `CreateNationalityPayload`, `CreateVisaPayload`, `EmergencyContactDto`, `EtaDto`, `HealthData`, `LoyaltyProgramDto`, `NationalityDto`, `NotificationPreferencesData`, `PreferencesData`, `PublicProfileData`, `UpdateAvatarPayload`, `UpdateEmergencyContactPayload`, `UpdateEtaPayload`, `UpdateLoyaltyProgramPayload`, `UpdateMePayload`, `UpdateMyProfilePayload`, `UpdateNationalityPayload`, `UpdateVisaPayload`, `UserProfileResponse`, `VisaDto`

### Definitions

- `getMe` (function) — GET `/v1/users/me`; returns `AppUser`
- `getPublicProfile` (function) — GET `/v1/users/:username/profile`; returns `PublicProfileData`
- `updateMe` (function) — PATCH `/v1/users/me` (displayName, profileVisibility, timezone)
- `getMyProfile` (function) — GET `/v1/users/me/profile`; returns `UserProfileResponse`
- `updateMyProfile` (function) — PATCH `/v1/users/me/profile`
- `updateMyAvatar` (function) — PATCH `/v1/users/me/avatar` with an `UpdateAvatarPayload`
- `getMyPreferences` (function) — GET `/v1/users/me/preferences`; returns `PreferencesData`
- `updateMyPreferences` (function) — PATCH `/v1/users/me/preferences`
- `getMyHealth` (function) — GET `/v1/users/me/health`; returns `HealthData`
- `updateMyHealth` (function) — PATCH `/v1/users/me/health`
- `getMyNotificationPreferences` (function) — GET `/v1/users/me/notification-preferences`; returns `NotificationPreferencesData`
- `updateMyNotificationPreferences` (function) — PATCH `/v1/users/me/notification-preferences`
- `getMyEmergencyContacts` (function) — GET `/v1/users/me/emergency-contacts`; returns `EmergencyContactDto[]`
- `createEmergencyContact` (function) — POST `/v1/users/me/emergency-contacts`
- `updateEmergencyContact` (function) — PATCH `/v1/users/me/emergency-contacts/:id`
- `deleteEmergencyContact` (function) — DELETE `/v1/users/me/emergency-contacts/:id`
- `getMyLoyaltyPrograms` (function) — GET `/v1/users/me/loyalty-programs`; returns `LoyaltyProgramDto[]`
- `createLoyaltyProgram` (function) — POST `/v1/users/me/loyalty-programs`
- `updateLoyaltyProgram` (function) — PATCH `/v1/users/me/loyalty-programs/:id`
- `deleteLoyaltyProgram` (function) — DELETE `/v1/users/me/loyalty-programs/:id`
- `getMyNationalities` (function) — GET `/v1/users/me/nationalities`; returns `NationalityDto[]`
- `createNationality` (function) — POST `/v1/users/me/nationalities`
- `updateNationality` (function) — PATCH `/v1/users/me/nationalities/:id`
- `deleteNationality` (function) — DELETE `/v1/users/me/nationalities/:id`
- `getMyEtas` (function) — GET `/v1/users/me/nationalities/:nationalityId/etas`; returns `EtaDto[]`
- `createEta` (function) — POST `/v1/users/me/nationalities/:nationalityId/etas`
- `updateEta` (function) — PATCH `/v1/users/me/nationalities/:nationalityId/etas/:id`
- `deleteEta` (function) — DELETE `/v1/users/me/nationalities/:nationalityId/etas/:id`
- `getMyVisas` (function) — GET `/v1/users/me/nationalities/:nationalityId/visas`; returns `VisaDto[]`
- `createVisa` (function) — POST `/v1/users/me/nationalities/:nationalityId/visas`
- `updateVisa` (function) — PATCH `/v1/users/me/nationalities/:nationalityId/visas/:id`
- `deleteVisa` (function) — DELETE `/v1/users/me/nationalities/:nationalityId/visas/:id`
- `checkUsernameAvailable` (function) — GET `/v1/users/username-available`; returns `{ available: boolean }`
- `searchUsers` (function) — GET `/v1/users/search` with query params and optional `AbortSignal`; returns `UserSearchResponse`

### Exports

- All 34 functions above — named

---

## users.service.test.ts

### Imports

- `./users.service` — all 34 user service functions
- `@/services/users.types` — all payload and DTO types
- `@/store/user` — `AppUser`
- `@/types/user` — `UserSearchResponse`
- `@chamuco/shared-types` — `AppCurrency`, `AppLanguage`, `AppTheme`, `DocumentStatus`, `EtaType`, `PassportStatus`, `ProfileVisibility`, `VisaCoverageType`, `VisaEntries`, `VisaType`

### Definitions

- (test file — Vitest suites for all user service functions)

### Exports

- (none)

---

## users.types.ts

### Imports

- `@chamuco/shared-types` — `AppLanguage`, `AppCurrency`, `AppTheme`, `BloodType`, `DateOfBirth`, `DietaryPreference`, `FoodAllergen`, `KeyStats`, `PassportStatus`, `PhobiaType`, `PhysicalLimitationType`, `MedicalConditionType`, `DocumentStatus`, `EtaType`, `VisaEntries`, `VisaCoverageType`, `VisaZone`, `VisaType`, `DisabledNotificationChannels`, `ProfileVisibility`, `ResolvedAsset`

### Definitions

- `BasicInfoProfile` (interface) — bio and homeCountry for the basic profile section
- `PersonalDetailsProfile` (interface) — full personal details (name, dob, phone, location, email, verification flags)
- `UserProfileResponse` (type) — intersection of `BasicInfoProfile` and `PersonalDetailsProfile`; matches GET `/v1/users/me/profile`
- `PreferencesData` (interface) — user preferences (language, currency, theme)
- `HealthArrayItem` (interface) — generic `{ code, description }` shape for health list items
- `HealthData` (interface) — full health record (bloodType, dietaryPreference, allergies, phobias, physical limitations, medical conditions)
- `NotificationPreferencesData` (type) — `{ optOuts: DisabledNotificationChannels }`
- `EmergencyContactDto` (interface) — emergency contact record (id, name, phone, relationship, isPrimary)
- `LoyaltyProgramDto` (interface) — loyalty program record (id, programName, memberId, notes)
- `NationalityDto` (interface) — nationality/passport record with passport status
- `EtaDto` (interface) — ETA travel authorization record
- `VisaDto` (interface) — visa record with coverage type, zone, and status
- `UpdateMePayload` (interface) — mutable top-level user fields (displayName, profileVisibility, timezone)
- `UpdateMyProfilePayload` (type) — partial of `BasicInfoProfile & PersonalDetailsProfile`
- `UpdateAvatarPayload` (interface) — avatar update with source (`'emoji' | 'gcs'`), target, and optional fileSize
- `CreateEmergencyContactPayload` (type) — `EmergencyContactDto` without `id`
- `UpdateEmergencyContactPayload` (type) — partial `EmergencyContactDto` without `id`
- `CreateLoyaltyProgramPayload` (type) — `LoyaltyProgramDto` without `id`
- `UpdateLoyaltyProgramPayload` (type) — partial `LoyaltyProgramDto` without `id`
- `CreateNationalityPayload` (type) — `NationalityDto` without `id` and `passportStatus`
- `UpdateNationalityPayload` (type) — partial of `CreateNationalityPayload`
- `CreateEtaPayload` (type) — `EtaDto` without server-managed fields
- `UpdateEtaPayload` (type) — partial of `CreateEtaPayload`
- `CreateVisaPayload` (type) — `VisaDto` without server-managed fields
- `UpdateVisaPayload` (type) — partial of `CreateVisaPayload`
- `PublicProfileData` (interface) — public-facing profile (username, displayName, avatar, bio, visibility, travelerScore, achievements, recognitions, keyStats, discoveryMap)

### Exports

- All definitions above — named

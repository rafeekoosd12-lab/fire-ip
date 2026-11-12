# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Global Default Deny**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Admin-Only Catalog Mutation**: Only verified administrators (`isAdmin()`) can create, update, or delete documents in `/cubeApps/{appId}`, `/cubePlans/{planId}`, `/satellitePlans/{planId}`, `/gamePackages/{pkgId}`, and `/admins/{adminUid}`.
3. **Public Storefront Read Enforcement (Zero Blanket Reads)**: Public `get` and `list` operations on `/cubeApps/{appId}`, `/cubePlans/{planId}`, `/satellitePlans/{planId}`, and `/gamePackages/{pkgId}` strictly evaluate `resource.data.isPublic == true` (or `isAdmin()`), forcing all unauthenticated/public queries to filter by `where('isPublic', '==', true)`.
4. **PII & Admin Isolation**: The `/admins/{adminUid}` collection contains admin emails and is strictly readable only by the document owner (`request.auth.uid == adminUid`) or a verified `isAdmin()`.
5. **Strict Key & Size Enforcement**: Every create/update validates exact required and allowed keys (`hasAll` and `hasOnly`), string length limits, bounded array sizes, and server timestamps (`request.time`).
6. **Immutable Creation Metadata**: `authorUid` and `createdAt` cannot be modified after creation.

## 2. The "Dirty Dozen" Payloads

1. **Unverified Admin Email Spoof**: Authenticated user with `email == "rafeekoosd12@gmail.com"` but `email_verified == false` attempting to create a `/cubeApps/app1` document.
2. **Non-Admin Write Attempt**: Regular signed-in user attempting to create or update a `/cubeApps/app1` document.
3. **Shadow Field Injection on Create**: Admin attempting to create `/cubeApps/app1` with an undeclared field `isSuperVerified: true`.
4. **Shadow Field Injection on Update**: Admin attempting to update `/cubeApps/app1` with an undeclared field `hackedField: "yes"`.
5. **Path ID Poisoning**: Attempting to create a document with an invalid ID containing spaces or special characters or exceeding 128 characters.
6. **Author Spoofing on Create**: Admin attempting to create `/cubeApps/app1` where `authorUid != request.auth.uid`.
7. **Immutable Field Mutation**: Admin attempting to change `createdAt` or `authorUid` during an `update` on `/cubeApps/app1`.
8. **Client Timestamp Forgery**: Attempting to create `/cubePlans/plan1` with a past/future `createdAt` timestamp not equal to `request.time`.
9. **Oversized String Exhaustion ("Denial of Wallet")**: Attempting to write a `title` string of 500 characters (limit is 160) to `/cubeApps/app1`.
10. **Unbounded Array Injection**: Attempting to write 25 elements into `setupSteps` (limit is 15) in `/cubeApps/app1`.
11. **Unfiltered Public List Query**: Public client attempting to `list` `/cubeApps` without filtering `isPublic == true` when private drafts (`isPublic == false`) exist.
12. **PII Leak on `/admins`**: Regular user `user_bob` attempting to `get` `/admins/user_alice`.

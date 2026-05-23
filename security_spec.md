# Security Specifications & Hardened TDD Specification

## 1. Data Invariants

1. **Student Boundaries**: A student profile can only be read, created, or modified by their managing parent (`parentId == auth.uid`).
2. **Dependent Collection Integrity**: Records in `grades`, `attendance`, `homeworks`, `appointments`, `messages`, and `invoices` can only be queried or modified if their root `parentId` property matches the authenticated user `request.auth.uid`.
3. **Immutability of Key Identification**: In all sub-collections, `parentId` and `studentId` fields are strictly immutable on updates.
4. **Broadcast Reach (Announcements)**: Anyone signed in with verified credentials can read school announcements (`isSignedIn()`), but no client is permitted to write or delete them (Server-only / Admin-only write paths). No admin role exists on client side; we block all client writes to the `announcements` collection.
5. **Secure Lists**: Any listed queries on collection levels must enforce queries restricted to `resource.data.parentId == request.auth.uid`.

---

## 2. The "Dirty Dozen" Payloads (Aesthetic Anti-Spoof Patterns)

These payloads are designed to challenge identity barriers and represent potential attack vectors to reject:

1. **Spoofed Parent ID on Student Account**: A parent tries to create a student profile setting `parentId` to a different user's UID.
2. **Cross-Tenant Grade Sneak**: Modifying a grade record belonging to another parent's student.
3. **Ghost Fields Injection**: Injecting an extra system status or premium subscription flag attribute into a homework record that is not in the schema.
4. **Negative Value Tuition Bill**: A parent writing/updating an invoice record to make the billing amount negative (`amount: -5000`) or marking an invoice as paid without a valid payment gateway transaction.
5. **Admin Escape Lockout**: Injecting an administrative role into a profile record to gain back-office controls.
6. **Student ID Overwrite**: Changing a grade record's `studentId` during an update to rebind that score to a sibling.
7. **Malformed Path Navigation Injection**: Using custom symbols `..` or path traversals within a generated document ID.
8. **Immortal Timestamp Overwrite**: Trying to falsify `createdAt` timing inputs with client machines.
9. **Spamming Messages with 1MB String**: Trying to write massive message footprints to overflow storage allocations.
10. **Anonymous Infiltration**: Trying to perform read/write queries without being authenticated or with unverified emails.
11. **Appointment Back-Dating**: Trying to create appointment times in the past, or editing appointment states of cancelled lists.
12. **Double Delete Injection**: Retrying a state delete without correct parent-relational permission.

---

## 3. Test Rules Structure

We will enforce security rules using a robust declarative state. Let's build the tests conceptually and implement the fortress `firestore.rules`.

# Hungry Saver Mobile App Specification (Information-Only)

## 1. Product Overview
- **Goal**: Enable donors, volunteers, admins, and community support teams to reduce food waste and fulfill community needs through city-based coordination.
- **Platforms**: Mobile-first React Native experience. This spec guides UI/UX, backend, QA, and documentation. No code changes included.

## 2. Brand & UI Guidelines
- **Canvas**: White primary background, single-column flow, generous spacing.
- **Primary Accent**: Gradient `#EAA640 → #EBE7E1` for buttons, highlights, progress.
- **Typography**: Poppins (preferred) or closest system fallback. Minimum 14pt body, 18–24pt headings.
- **Imagery**: Friendly photography/illustrations showing community care. Provide accessibility alt text for all images.
- **Buttons & CTAs**: Rounded corners, high-contrast text, microcopy for reassurance.
- **Roles**: `admin`, `donor`, `volunteer`, `community_support (CS)`.

## 3. Core Initiatives (Cards + Donation Context)
1. **Annamitra Seva** — Provides surplus meals to shelters in need. CTA: Learn more / Donate.
2. **Vidya Jyothi** — Supplies stationery, uniforms, digital tools to students. CTA: Learn more / Donate.
3. **Suraksha Setu** — Offers safety kits and hygiene packs for vulnerable communities. CTA: Learn more / Donate.
4. **PunarAsha** — Supports rehabilitation centers with clothing and essentials. CTA: Learn more / Donate.
5. **Raksha Jyothi** — Focuses on medical aid and emergency response supplies. CTA: Learn more / Donate.
6. **Jyothi Nilayam** — Funds shelter improvements and daily necessities for homes. CTA: Learn more / Donate.

## 4. Page Specifications

### 4.1 Home Page (Guest & Logged-In)
- **Header**  
  - Left: Hungry Saver logo (alt: "Hungry Saver home").  
  - Right (guest): `Login` / `Sign up`. Logged-in: avatar chip with quick menu (`Profile`, `Logout`).
- **Hero**  
  - Title: "Hungry Saver".  
  - Subtitle: "Save food, save lives — donate, volunteer, support your city".  
  - Primary CTA button: `Donate Now` (opens donation-type selector modal).  
  - Secondary CTA button: `Volunteer` (opens volunteer signup flow).  
  - Hero image placeholder with alt text describing inclusive community scene.
- **Initiatives Section**  
  - Layout: six cards (responsive grid or horizontal scroll).  
  - Each card: initiative title, one-line description (from section 3), CTA buttons `Learn more`, `Donate`.
- **How It Works**  
  1. Donor posts available food/items.  
  2. Volunteer accepts & picks up.  
  3. Delivery confirmed and proof uploaded.
- **Impact Counters** (dynamic, real-time feed): `Meals Saved`, `Volunteers Active`, `Donations Completed`, `Cities Active`. Include live pulse state and accessible labels.
- **Footer**  
  - Contact info, quick links (`Privacy`, `Terms`).  
  - Hotline: `8317579761`.  
  - Social icons (future) with alt text.
- **Microcopy**: Friendly confirmations, alt text on hero, accessible CTA labels.

### 4.2 Admin Dashboard (Admin-only)
- **Top Bar**: App name, current date/time, shortcuts `System Settings`, `Logout`.
- **KPI Widgets**:  
  - Total donations.  
  - Pending pickups.  
  - Volunteers active.  
  - Community requests open.  
  - Donations today.
- **Recent Activity Feed**: Last 20 actions, showing `user`, `action`, `timestamp`.
- **Volunteer Approvals Queue**: Table with volunteer info, document preview, action buttons `Approve`, `Reject`, reason textarea.
- **City Summary**: Table/list grouped by `city` (donations count, active volunteers, open requests).
- **Donation Exceptions & Flags**: Filterable list, actions `View details`, `Investigate`, `Mark resolved`, assign to admin.
- **Reports & Exports**: Options to export CSV/Excel by date range, city, initiative.
- **Alerts Module**: Highlights flagged anomalies (e.g., delayed pickup > threshold, suspected falsified proof). Provide quick triage actions (acknowledge, assign, resolve).
- **Admin Actions Panel**:  
  - Manage initiatives (add/edit title & description).  
  - Manage users (suspend/unsuspend, change role).  
  - Set operational thresholds (auto-flag delay hours, proof requirements).
- **Audit Logs Viewer**: Filters by user, action, date; detail drawer showing before/after payload snapshots.

### 4.3 Donor Dashboard (Donor-only)
- **Top Bar**: Profile icon, `New Donation` button.
- **Active Donations List**  
  - Each card includes: Donation ID, Initiative, Item summary, Quantity, City, Preferred pickup window, Volunteer assigned (name/anon), ETA, current status badge (Available → Accepted → Pickup → Donated → Completed).  
  - Include proof image thumbnail once delivered, `Feedback` button.  
  - Actions: `Edit` (only when status `Available`), `Cancel` (only before acceptance), `Message volunteer`.
- **Community Requests Section**  
  - Visible if donor opted into city community support. Cards highlight request details and CTAs to pledge items.
- **Donation History**  
  - Table/list with proof images, completion date, volunteer, rating/outcome.
- **Quick Actions**: `Create Donation`, `Edit Profile`, `View assigned volunteers`.
- **Microcopy**: confirmations for cancellation, success toasts for updates, guidance on statuses.

### 4.4 Volunteer Dashboard (Volunteer-only)
- **Top Bar**: Profile, availability toggle (`Available`/`Unavailable`).
- **Available Tasks List** (filtered by `city`)  
  - Fields: Donation ID, Initiative, Donor name (or "Anonymous Donor"), pickup address (city + short address), preferred window, distance estimate (if location consented), reward/points (optional).  
  - Actions: `Accept` (atomic), `Navigate` (maps deep link), `Mark Pickup`, `Upload Proof`, `Mark Complete`.
- **My Tasks Timeline**  
  - Sections for `Assigned` and `In-progress`, each visualizing statuses (Accepted → Picked up → Delivered) with timestamps.
- **Performance Panel**: tasks completed, average pickup time, donor ratings.
- **Safety & Guidance Modal**: do's/don'ts for pickup/delivery, accessible from top-level help icon.
- **Microcopy**: confirm dialogues before advancing status, instructions on proof uploads.

### 4.5 Community Support Dashboard (community_support-only)
- **Top Bar**: Profile, `New Request` button.
- **Requests List**  
  - City-filtered requests with cards showing Request ID, beneficiary name, need summary, proof docs thumbnails, urgency level, images.
- **Actions**: `Edit request`, `Withdraw request`, `Accept donation` (if a donor pledges).
- **Visibility Rules**: Donors see city-matched requests; volunteers see only approved or assigned ones.

## 5. User Challenges & Tasks (Product & QA Guidance)
- **Admin challenges**: volunteer authenticity approvals, addressing flagged/false donations, managing city-level load balancing.
- **Donor challenges**: fast donation creation, confidence in volunteer pickup, safe proof upload.
- **Volunteer challenges**: receiving nearby tasks (city match), clear status transitions/proof requirements, managing availability & performance metrics.
- **Community Support challenges**: verifying beneficiary proof, matching donors willing to fulfill specific needs.
- **Cross-role tasks**: reliable notifications, integrity of image upload/storage, enforcing accurate `city` matching across flows.

## 6. Forms

### 6.1 Donation Form (Canonical for All Initiatives)
- **Title**: "Create Donation".
- **Fields**  
  1. Donor ID (system-filled, hidden).  
  2. Initiative dropdown (six options). REQUIRED.  
  3. Donation type radio: Food / Clothes / Items / Cash-in-kind. REQUIRED.  
  4. Title / Short description (max 120 chars). REQUIRED.  
  5. Detailed description (optional, max 800 chars).  
  6. Quantity / Units (text or numeric). REQUIRED, must be > 0.  
  7. Pickup city autocomplete/dropdown (supported list). REQUIRED.  
  8. Pickup address (text). OPTIONAL but recommended.  
  9. Preferred pickup date & time window (start/end datetimes). REQUIRED; start < end; must be future.  
 10. Images upload (0–5 JPG/PNG, ≤5MB each). Strongly recommended.  
 11. Contact phone (prefilled, editable). REQUIRED with validation.  
 12. Special instructions (optional textarea).  
 13. Visibility toggle: Public / Anonymous donor (default Public).  
 14. Submit button: "Post Donation".
- **Validation**: Initiative selected, quantity positive, city required and validated, time window future & logical, images type/size, phone formatting.
- **Post-submission**: Save as status `Available`, notify same-city volunteers via push/in-app, show confirmation with Donation ID + share link, highlight packaging/hygiene tips microcopy.

### 6.2 Community Request Form
- **Title**: "Create Community Request".
- **Fields**  
  1. Requester ID (system).  
  2. Request title (short). REQUIRED.  
  3. Description of need (detailed). REQUIRED.  
  4. Beneficiary name & optional contact. OPTIONAL.  
  5. City. REQUIRED.  
  6. Urgency (Low / Medium / High). REQUIRED.  
  7. Proof documents (0–5 images, JPG/PNG, ≤5MB).  
  8. Preferred delivery timeframe (optional date range).  
  9. Requested items list (structured: item name, qty, notes).  
 10. Visibility toggle: Public / Private.  
 11. Submit button: "Post Request".
- **Post-submission**: Status `Open`, notify opted-in donors by city, high urgency triggers admin review.
- **Validation**: City + description required, proof recommended for High urgency with reminders.

## 7. Backend Data Models (Schema Reference)
- **USERS**  
  - `id` string UUID  
  - `name` string  
  - `email` string unique  
  - `phone` string  
  - `role` enum [`admin`,`donor`,`volunteer`,`community_support`]  
  - `city` string  
  - `profile_image_url` string  
  - `status` enum [`active`,`suspended`,`pending_verification`]  
  - `created_at`, `updated_at` datetimes
- **INITIATIVES**: `id`, `name`, `short_description`, `long_description`, `is_active` boolean, timestamps.
- **DONATIONS**: `id`, `donor_id`, `initiative_id`, `donation_type` enum [`food`,`clothes`,`items`,`cash`], `title`, `description`, `quantity` (string/number), `city`, `pickup_address`, `time_window_start`, `time_window_end`, `images[]`, `status` enum [`available`,`accepted`,`picked_up`,`donated`,`completed`,`cancelled`], `assigned_volunteer_id` nullable, timestamps.
- **COMMUNITY_REQUESTS**: `id`, `requester_id`, `title`, `description`, `city`, `urgency`, `proof_images[]`, `items[]`, `status` enum [`open`,`fulfilled`,`withdrawn`], timestamps.
- **VOLUNTEER_TASK_LOG**: `id`, `donation_id`, `volunteer_id`, `action` enum [`accepted`,`picked_up`,`delivered`,`cancelled`], `timestamp`, `notes`, `proof_images[]`.
- **NOTIFICATIONS**: `id`, `user_id`, `type`, `payload` JSON, `is_read` boolean, `created_at`.
- **AUDIT_LOGS**: `id`, `user_id`, `action`, `target_type`, `target_id`, `before` JSON, `after` JSON, `timestamp`.
- **RATINGS_FEEDBACK**: `id`, `donation_id`, `rater_id`, `rated_user_id`, `rating` (1–5), `comment`, `created_at`.

## 8. Backend API Specification (REST-like)
- **Auth**  
  - `POST /auth/signup` `{name,email,phone,password,role,city}` → user + token.  
  - `POST /auth/login` `{email,password}` → token.  
  - `POST /auth/logout` → invalidates token.
- **Users**  
  - `GET /users/:id` → profile.  
  - `PUT /users/:id` → profile update.  
  - `GET /users?role=volunteer&city=CityName` (admin).  
  - `POST /users/:id/verify` (admin) → approve volunteer.
- **Initiatives**  
  - `GET /initiatives`.  
  - `POST /initiatives` (admin).  
  - `PUT /initiatives/:id` (admin).
- **Donations**  
  - `POST /donations` → create donation (`status=available`).  
  - `GET /donations/:id`.  
  - `GET /donations?city=CityName&status=available` (volunteer feed).  
  - `PUT /donations/:id` (editable statuses).  
  - `POST /donations/:id/accept` `{volunteer_id}` → atomic accept.  
  - `POST /donations/:id/pickup` `{volunteer_id,timestamp}`.  
  - `POST /donations/:id/deliver` `{volunteer_id,proof_images[]}` → updates to `donated`/`completed`.  
  - `POST /donations/:id/cancel`.
- **Community Requests**  
  - `POST /requests`.  
  - `GET /requests?city=CityName`.  
  - `PUT /requests/:id/status` (admin).
- **Notifications**  
  - `GET /notifications`.  
  - `POST /notifications/mark-read`.
- **Reports**  
  - `GET /reports/donations?city=&from=&to=&initiative=` outputs CSV/JSON summary.
- **Admin Tools**  
  - `POST /admin/volunteers/:id/approve`.  
  - `POST /admin/flag/:donation_id` `{reason}`.

### Sample Payloads
- **POST /donations**  
```
{
  "initiative_id": "init_annamitra",
  "donation_type": "food",
  "title": "Fresh lunch trays",
  "description": "25 veg meals ready before 2PM",
  "quantity": "25 meals",
  "city": "Bengaluru",
  "pickup_address": "Koramangala 5th Block",
  "time_window_start": "2025-11-25T11:00:00Z",
  "time_window_end": "2025-11-25T14:00:00Z",
  "images": [],
  "contact_phone": "+91-9000000001",
  "visibility": "public"
}
```

## 9. Realtime & Event Flows
- Use pub/sub (e.g., Firebase Cloud Messaging or WebSocket) to broadcast:  
  - New donation created → volunteers in same `city`.  
  - Donation status updates (accepted/picked_up/delivered) → donor + assigned volunteer.  
  - Volunteer approval status → volunteer + admin.  
- Event payload standard: `{event_type, donation_id, status, city, timestamp, metadata}`.
- If using Firestore/Realtime DB:  
  - Security rules enforce role-based writes, ensure `city` field required and matches user’s city on writes.

## 10. Storage & Media
- Store images in cloud storage (S3/Firebase).  
- Path pattern: `/{env}/users/{userId}/donations/{donationId}/{filename}`.  
- Auto-generate thumbnails for lists; store metadata with dimensions/size.  
- Validate MIME type, sanitize filenames, apply malware scanning if possible.  
- Enforce ≤5MB per image, limit to 5 per record.

## 11. Auth, RBAC & Security
- **Auth**: JWT or Firebase Auth with refresh tokens. Tokens expire; refresh endpoints required.  
- **RBAC**:  
  - Admin: full read/write, manage settings.  
  - Donor: manage own donations, view community requests in city.  
  - Volunteer: accept/update assigned donations, view city feed, update availability.  
  - Community Support: create/manage own requests.  
- **Validation**: server-side for all fields (city, status transitions, timestamps).  
- **Rate Limiting**: apply to create endpoints (donations, requests).  
- **Logging**: critical actions captured in `AUDIT_LOGS`.  
- **Data Privacy**: store minimal contact info, require consent before sharing donor phone with volunteers, allow deletion request flows.

## 12. Business Rules
- **Matching**: Only volunteers with `city == donation.city` receive notifications or can accept donation.  
- **Assignment**: `POST /donations/:id/accept` is atomic; first success locks donation to one volunteer.  
- **Proof Requirement**: `delivered`/`completed` statuses require proof_images uploaded by volunteer; system enforces before status change.  
- **Cancellation**:  
  - Donor can cancel if `status=available`.  
  - Volunteer can cancel assignment, donation returns to `available`.  
  - Admin may cancel with reason at any state.  
- **Verification**:  
  - High-value/high-urgency community requests require admin check before broadcast.  
  - Volunteers remain `pending_verification` until admin approval; only approved volunteers receive tasks.  
- **Anomaly Detection** (admin panel + logs):  
  - Delay threshold between accept and pickup.  
  - Duplicate/missing proof images flagged.  
  - Suspicious volume from single account flagged for review.

## 13. Notifications & Communication
- Channels: push, in-app, email (critical).  
- Sample triggers:  
  - New donation in my city (volunteers).  
  - Donation accepted (donor).  
  - Volunteer assigned (both parties).  
  - Proof uploaded & donation completed (donor).  
  - Volunteer approval result (volunteer).  
  - Admin flags/alerts (admin).  
- Messages include donation id, city, short link, CTA (e.g., `View Task`, `Review Donation`).  
- Allow notification preferences per role (opt-in/out except mandatory compliance alerts).

## 14. Data Privacy & Compliance Notes
- Store minimum personal data (name, phone, city).  
- Provide consent toggle for sharing contact details.  
- Data deletion flow: user submits request, admin confirms and executes anonymization/deletion.  
- Encrypt data at rest/in transit; maintain secure backups.  
- Document DPDP/GDPR compliance statements and retention schedules.

## 15. Acceptance Criteria & QA Checklist
- All roles authenticate and see role-appropriate dashboards.  
- Donation lifecycle tested end-to-end (create → accept → pickup → deliver → complete).  
- City-based matching validated (only same-city volunteers get tasks & notifications).  
- Volunteer approval pipeline: pending → admin approves → volunteer receives tasks.  
- Image upload/storage with thumbnail generation verified.  
- Notifications fired for each major status change.  
- Admin generates city/date/initiative reports; exports succeed.  
- Community requests visible to city donors; requests can be fulfilled/closed.  
- Race-condition coverage: atomic accept tested under load.  
- Security: RBAC validated for each endpoint, rate limiting enforced.

## 16. Documentation & Repo Deliverables
- `prompt.md` (this spec).  
- Assets list with filenames & usage guidelines (logo variants, hero images, avatar samples).  
- API spec (section 8) plus sample payloads.  
- Data model docs (section 7).  
- Acceptance criteria & QA test cases (section 15).  
- Security & privacy notes (section 14).  
- Deployment variables template `.env.example` (see section 18).  
- Admin onboarding doc (steps to create first admin, approve volunteers).  
- Troubleshooting guide (common errors: failed uploads, notification delivery, auth issues).

## 17. Assets (to be delivered later)
- **Logos**: Hungry Saver primary logo (SVG, PNG), monochrome variant.  
- **Color swatches**: gradient (#EAA640 → #EBE7E1), neutral grays (#333333 text, #F5F5F5 cards).  
- **Hero images**: at least two lifestyle/community photos sized for mobile hero.  
- **Sample user avatars**: PNG/SVG for donors, volunteers, community support.  
- **Icon set**: vector icons for statuses (Available, Accepted, Pickup, Donated, Completed).  
- Provide accessible alt text guidance for each asset.

## 18. Environment & Config Keys (`.env.example`)
- `APP_ENV=` (development/staging/production)  
- `APP_URL=`  
- `DB_URI=` (Postgres/MySQL/Firestore connection)  
- `STORAGE_BUCKET_URL=`  
- `AUTH_SECRET=` (JWT signing secret)  
- `EMAIL_SMTP_HOST=`, `EMAIL_SMTP_USER=`, `EMAIL_SMTP_PASS=`  
- `PUSH_SERVICE_KEY=` (FCM/APNS key)  
- `ADMIN_FIRST_EMAIL=` (bootstrap admin user)  
- (Optional) `ANALYTICS_KEY=`, `MAPS_API_KEY=`

## 19. Sample Test Data (QA Fixtures)
- **Cities**: Bengaluru, Hyderabad, Chennai.  
- **Volunteers (5)**:  
  1. `vol_ben_01` — Asha Rao — Volunteer — `city=Bengaluru`.  
  2. `vol_ben_02` — Nikhil Jain — Volunteer — `city=Bengaluru`.  
  3. `vol_hyd_01` — Priya Ahmed — Volunteer — `city=Hyderabad`.  
  4. `vol_hyd_02` — Manoj Kulkarni — Volunteer — `city=Hyderabad`.  
  5. `vol_che_01` — Kavya Krishnan — Volunteer — `city=Chennai`.
- **Donations (10)**:  
  - Bengaluru: `don_bn_001` (Annamitra Seva, 30 meals), `don_bn_002` (Suraksha Setu hygiene kits), `don_bn_003` (Vidya Jyothi books).  
  - Hyderabad: `don_hy_001` (PunarAsha clothing), `don_hy_002` (Raksha Jyothi medical supplies), `don_hy_003` (Annamitra Seva snacks).  
  - Chennai: `don_ch_001` (Jyothi Nilayam bedding), `don_ch_002` (Vidya Jyothi tablets), `don_ch_003` (Suraksha Setu masks), `don_ch_004` (Raksha Jyothi first-aid kits).  
- Each donation includes: donor ID, assigned volunteer (if accepted), proof URLs placeholder, status progression notes.
- **Community Requests**:  
  - `req_bn_urgent` — Bengaluru — High urgency shelter food needs, proof doc attached.  
  - `req_hy_medium` — Hyderabad — School supplies, medium urgency.  
  - `req_ch_low` — Chennai — Bedding restock, low urgency.

## 20. Sign-Out & Usage Notes
- This document is informational; do **not** edit code directly based on it.  
- Default to safe assumptions: require `city`, enforce proof before completion, require volunteer approval.  
- Use spec to drive development tasks, test cases, documentation, and QA planning.  
- Ambiguities: resolve via safe defaults or escalate for clarification.



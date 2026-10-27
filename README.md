# Mostanad Academy

Responsive Arabic/English website for Mostanad Academy, with the academy landing page, training resources, project-document templates, social posts, and learning pages.

## Preview

Open `index.html` directly, or use the VS Code Live Server extension to preview the full site. No build step or package installation is required.

The landing page and learning portal support Arabic and English. The shared theme button keeps the light/dark preference across the landing page, portal, privacy policy, and resource pages using the browser's local storage.

The homepage and learning portal include FAQs, and the course previews outline prerequisites and learning outcomes. Current prices are informational only; online payments and external analytics are not enabled. The site includes a bilingual operational draft of the terms of use; the academy owner should review the legal and privacy text against the actual deployment and local requirements before launch.

## Pages

- `index.html` — bilingual academy landing page and navigation to the main resources.
- `404.html` — branded fallback page for invalid URLs.
- `privacy-policy.html` — privacy information.
- `terms-of-use.html` — bilingual draft terms of use; requires owner review before public launch.
- `DC posts/DC posts.html` — document-control knowledge posts.
- `HTML/Mostanad Academy Library.html` — document library, templates, and logs.
- `HTML/Document Controller Plan.html` — document-control plan.
- `HTML/Archiving System.html` — archiving guidance.
- `HTML/Excel Automation Roadmap.html` — Excel learning roadmap.
- `HTML/Linkedin Posts.html` and `HTML/facebook posts.html` — social post collections.
- `HTML/SUPER_DC_Document_Control_Pro.html` — interactive learning game.
- `shared-site.css` and `shared-site.js` — shared navigation, footer, responsive layout, and theme support for resource pages.
- `Mostanad_Academy_Library_FIXED.html` — legacy URL that redirects to the current library page.

The repository also retains its PDF, Word, Excel, archive, image, and verification files. Keep their existing folder names and relative paths so document links continue to work.

The site uses the shared `mostanad-academy-theme` preference across the homepage, academy portal, document library, social pages, and privacy page. New visitors start in dark mode; the header's theme control changes the preference for all site pages.

## Learning portal (Supabase)

The portal at `academy/index.html` includes a public preview of sample course topics, invited-account sign-in, Google sign-in, student course enrollment, course and lesson authoring, private lesson resources and assignment submissions, progress tracking, server-scored quizzes, a Gemini tutor, and Google Drive/Meet actions. Public account creation is disabled. The initial administrator is bootstrapped by the academy owner; administrators can send student/instructor invitations, approve their email addresses, change student/instructor roles, and suspend or restore account access. The instructor/admin workspace supports course and lesson authoring and course-resource uploads; admins can publish courses and manage enrollments. Account suspension is enforced in Auth and by a database access policy. Instructors and administrators can set each course's optional duration, displayed price, and schedule in Arabic and English; these details are informational, and payments are not connected. The public course preview includes sample prerequisites and learning outcomes; live courses, accounts, videos, private data, email delivery, Google integrations, and the AI tutor require the academy owner to configure the provider projects below.

### 1. Create and configure Supabase

1. Create a Supabase project and add its URL and **publishable/anon** key to `academy/config.js`. Only the public key belongs there; never put a service-role key or Gemini API key in a browser file.
2. Apply all database migrations (including the administrator content-access policies) and deploy the protected Edge Functions:

   ```powershell
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   supabase functions deploy tutor
   supabase functions deploy quiz-admin
   supabase functions deploy quiz-submit
   supabase functions deploy certificate-issue
   supabase functions deploy admin-users
   supabase functions deploy admin-invite
   ```

3. Configure the initial administrator and invitation redirect as server-side secrets. Set the initial administrator email to the exact address supplied by the academy owner; it is checked by the protected one-time administrator invite function and is never embedded in the website:

   ```powershell
   supabase secrets set "INITIAL_ADMIN_EMAIL=YOUR_ADMIN_EMAIL"
   supabase secrets set "ACADEMY_REDIRECT_URL=https://YOUR_DOMAIN/academy/index.html"
   ```

   For local preview, set `ACADEMY_REDIRECT_URL` to the exact local academy URL and add it to Supabase Auth's allowed redirect URLs. Production must use the exact deployed HTTPS URL.

4. Approve the initial administrator email before creating the first Auth account. Run this in the Supabase SQL editor, substituting the same owner email:

   ```sql
   insert into public.academy_invites (email, role, status)
   values (lower(trim('YOUR_ADMIN_EMAIL')), 'student', 'approved')
   on conflict (lower(email)) do update
     set role = 'student', status = 'approved', user_id = null, accepted_at = null;
   ```

   Then invite that email from the Supabase Auth dashboard, confirm the email, sign in, and redeem the one-time administrator code. Public sign-up remains disabled; all later student or instructor accounts are approved and invited from the administrator dashboard. Email invitations require Supabase Auth email delivery to be configured and tested.

5. Generate the one-time administrator invite locally; it is printed only in your terminal. Share it directly with the intended account holder, not in source files or chat:

   ```powershell
   $adminInvite = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
   supabase secrets set "ADMIN_INVITE_CODE=$adminInvite"
   Write-Output "One-time administrator invite: $adminInvite"
   Remove-Variable adminInvite
   ```

   Set the Gemini key separately as a server-side Supabase secret:

   ```powershell
   supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```

6. In Supabase Auth, enable email and Google sign-in, turn off public user sign-ups, and set the site URL and allowed redirect URL (ending in `/academy/index.html`). The administrator dashboard can invite approved student/instructor emails, change student/instructor roles, suspend or restore sign-in, publish courses, and manage lessons/resources. The initial administrator code can promote only the configured, email-confirmed owner account and can be redeemed once. To add or remove other administrators, use the owner-only SQL process below:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where lower(email) = lower('owner@example.com'));
   ```

   Promote additional trusted instructors by changing `admin` to `instructor` in the same owner-only query. Role assignment is otherwise unavailable in the website.

The migrations create private course-resource and assignment-submission buckets, row-level access policies, protected quiz answer keys, and an hourly tutor quota. Administrators can manage courses, course files, enrollments, assignments, and live sessions; role updates are limited to student/instructor accounts, while promoting or demoting an administrator remains an owner-only SQL operation. Course duration, display price, and schedule are optional Arabic/English fields set when a course is created. Price text is informational only; checkout is not connected. Course resources are limited to 50 MB; student assignment submissions use private, expiring download links. Videos are uploaded to the signed-in instructor's Google Drive in resumable chunks (up to 500 MB), and remain private unless the instructor explicitly selects the option to share them with current enrollees.

Each lesson must have a configured quiz to qualify for a course-completion certificate. Lesson progress is recorded by the server only after a student passes that lesson's quiz; students cannot write completion records directly. Apply the database migrations with `supabase db push`, then deploy the updated `quiz-submit` and `certificate-issue` functions.

### 2. Configure Google

- In Google Cloud Console, enable Google Drive API and Google Calendar API, configure the OAuth consent screen, and create an OAuth client for the deployed website.
- Add the OAuth client ID/secret to the Google provider in Supabase Auth. Configure the required OAuth consent/scopes for `drive.file` and `calendar.events`; the owner may need to verify the consent screen or add test accounts while the app is in testing.
- Add the exact academy website origin and Supabase Auth callback URL to the Google OAuth client's allowed origins and redirect URIs.
- Google sign-in is required for Drive uploads and Meet scheduling. Drive videos are private by default. Sharing grants read access only to the currently enrolled students' Google email addresses; newly enrolled students must be shared explicitly later in Google Drive. Calendar events are created in the instructor's primary calendar.
- An optional private Drive folder ID can be entered in `academy/config.js` as `googleDriveFolderId`.

### 3. Publish and test

Publish the repository root as a static site (for example, GitHub Pages), preserving the `academy`, `supabase`, `HTML`, `DC posts`, `IMG`, and `PDF` directories and their exact capitalization. Configure the same published `/academy/index.html` URL in Supabase Auth. Test admin-created student and instructor accounts, email confirmation, sign-in, student enrollment, course access, submissions, instructor publishing, Google permissions, and Edge Functions with separate test accounts before inviting learners.

Payments are not connected. Email delivery, Google OAuth consent, Gemini usage/cost limits, and any production privacy/retention requirements must be configured and reviewed by the academy owner before public launch. Do not paste credentials into source control or chat.

Before public launch, have the academy owner review the privacy policy, operational terms draft, contact channels, course outcomes, testimonials, and any displayed prices/schedules. Exercise the full student and instructor workflows with test accounts, verify role and private-file access, check the deployed site on phone and desktop, and confirm that all internal document links work. The portal remains unavailable for account actions until valid Supabase settings, migrations, and required server-side functions are configured.

## GitHub Pages

The site is a static website. Publish from the repository root on the `main` branch; keep `index.html` at the root and include the `HTML`, `DC posts`, `IMG`, and `PDF` directories with their assets.

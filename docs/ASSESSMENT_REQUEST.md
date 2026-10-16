# IPTECHIE MERN STACK DEVELOPER ASSESSMENT
# TASK MANAGEMENT APPLICATION
# COMPLETE FUNCTIONALITY AUDIT, COMPLIANCE CHECK AND TESTING

ROLE:
Act as a Senior MERN Stack Developer, Software QA Engineer,
Application Security Auditor, Database Engineer, and Technical
Assessment Evaluator.

PROJECT:
Audit my EXISTING Task Management Application repository.

TECHNOLOGY:
- MongoDB
- Express.js
- React.js
- Node.js
- Mongoose
- JWT
- bcrypt

OBJECTIVE:
Determine whether my existing application correctly implements
EVERY requirement of the IPTechie MERN Stack Developer Assessment.

The assessment has a duration of 4–6 hours and a total of 100 marks.

Your job is to verify the actual implementation, execute tests,
identify defects, assess compliance, and produce an evidence-based
report.

IMPORTANT RULES:

1. Do not assume a feature works because its code exists.
2. Do not assume a feature works because its UI looks correct.
3. Do not award marks for features that are merely documented.
4. Verify the actual frontend, backend, database, and API integration.
5. Do not fabricate test results.
6. Do not ignore failing tests.
7. Do not disable tests to make the project pass.
8. Do not rewrite the entire project unnecessarily.
9. Preserve existing functionality unless a change is required.
10. Fix confirmed defects when safe, then rerun the relevant tests.
11. Do not implement unrelated features during this audit.
12. Prioritize compliance with the original assessment over optional
    features such as teams, real-time collaboration, and time tracking.
13. Distinguish verified functionality from unverified functionality.
14. Use the exact assessment rubric provided below.
15. Do not stop after generating a checklist. Perform the audit.

========================================================
PHASE 1: INSPECT THE EXISTING REPOSITORY
========================================================

Inspect the complete project before changing any files.

Identify:

- Frontend source code.
- Backend source code.
- package.json files.
- React pages and components.
- React Router configuration.
- API client and request configuration.
- Custom React hooks.
- Express routes.
- Controllers.
- Middleware.
- Mongoose models.
- Database configuration.
- Authentication implementation.
- JWT configuration.
- Password hashing logic.
- Validation logic.
- Error handling.
- Test suites.
- README.md.
- .env.example.
- .gitignore.
- API documentation or Postman collection.
- Seed scripts and demo credentials.
- Existing screenshots.
- Git status and repository structure.

Identify the actual commands available for running the frontend,
backend, tests, and production builds.

Do not assume the repository follows a particular folder structure.

Do not modify files during the initial inspection.

Create an inventory of existing features and their implementation
locations.

========================================================
PHASE 2: ESTABLISH THE BASELINE
========================================================

Before fixing anything, run the available verification commands.

Execute, as applicable:

- Backend tests.
- Frontend tests.
- Backend build or syntax checks.
- Frontend production build.
- Lint checks.
- Type checks.
- Database integration tests.

Record:

- Exact command.
- Whether execution succeeded.
- Number of tests passed.
- Number of tests failed.
- Number of skipped tests.
- Any execution errors.
- Any environmental limitations.

If a command does not exist, record it as missing.

If a test cannot execute because MongoDB or another dependency is
unavailable, report that limitation.

Do not treat an unexecuted test as a passing test.

Never run destructive tests against a production database.

========================================================
PHASE 3: AUDIT PART 1 — BACKEND DEVELOPMENT
MAXIMUM: 30 MARKS
========================================================

A. AUTHENTICATION — 10 MARKS

Verify each requirement individually.

Registration:

[ ] POST /api/auth/register exists.
[ ] Registration accepts name, email, and password.
[ ] Required fields are validated.
[ ] Invalid email addresses are rejected.
[ ] Invalid passwords are rejected according to the implemented policy.
[ ] Duplicate email addresses are handled correctly.
[ ] Passwords are hashed using bcrypt before database storage.
[ ] Plain-text passwords are never stored.
[ ] Password hashes are never returned to the client.
[ ] Registration returns an appropriate HTTP status code.
[ ] Registration errors are handled correctly.

Login:

[ ] POST /api/auth/login exists.
[ ] Login accepts email and password.
[ ] Valid credentials authenticate successfully.
[ ] Invalid credentials are rejected.
[ ] The response includes the required authentication result.
[ ] JWT tokens are signed correctly.
[ ] JWT expiration is configured.
[ ] Authentication failures return appropriate HTTP status codes.
[ ] Sensitive authentication details are not exposed.

Authentication middleware:

[ ] Private routes require authentication.
[ ] Missing tokens are rejected.
[ ] Invalid tokens are rejected.
[ ] Expired tokens are rejected.
[ ] Authenticated user identity is derived from the verified token.
[ ] Protected API requests work with a valid token.

For each requirement, inspect the implementation and execute
appropriate tests.

B. TASK CRUD API — 15 MARKS

Verify the following endpoints.

1. GET /api/tasks

Expected:
- Returns tasks belonging to the authenticated user.
- Does not expose another user's private tasks.
- Supports pagination if implemented.
- Supports sorting if implemented.
- Handles an empty task list.
- Returns an appropriate response structure.

2. POST /api/tasks

Expected:
- Creates a task with valid input.
- Validates required fields.
- Associates the task with the authenticated user.
- Sets appropriate timestamps.
- Rejects invalid status and priority values.
- Rejects invalid dates.
- Does not trust a client-supplied userId as proof of ownership.

3. GET /api/tasks/:id

Expected:
- Returns the requested task to its authorized owner.
- Rejects invalid identifiers appropriately.
- Prevents unauthorized access to another user's task.
- Returns the appropriate response when the task does not exist
  or is inaccessible.

4. PUT /api/tasks/:id

Expected:
- Updates an authorized task.
- Validates updated values.
- Updates timestamps correctly.
- Rejects unauthorized modifications.
- Prevents ownership manipulation through crafted requests.
- Handles nonexistent tasks appropriately.

5. DELETE /api/tasks/:id

Expected:
- Deletes the authorized user's task according to the intended
  deletion behavior.
- Prevents unauthorized deletion.
- Handles nonexistent tasks appropriately.
- Returns an appropriate HTTP status code.

6. DATA MODEL COMPLIANCE

Verify support for these assessment fields:

- title
- description
- status
- priority
- dueDate
- userId
- createdAt
- updatedAt

Expected status values:

- pending
- in-progress
- completed

Expected priority values:

- low
- medium
- high

IMPORTANT:
If the implementation uses uppercase enum values or alternative
internal names, inspect the mapping and verify that the application
preserves the assessment's required semantics.

Do not mark a mismatch solely because internal naming differs if
the required behavior is correctly supported.

However, report incompatible API values or missing required fields.

7. MULTI-USER AUTHORIZATION

Create two separate test users.

User A creates a task.

User B attempts to:

- List User A's private tasks.
- Retrieve User A's task by ID.
- Update User A's task.
- Delete User A's task.
- Change the task's owner.
- Access the task using a modified request body.

Verify that the backend prevents unauthorized access.

Do not rely on frontend restrictions.

C. VALIDATION AND ERRORS — 5 MARKS

Verify:

[ ] Input validation exists.
[ ] Appropriate HTTP status codes are used.
[ ] Error handling is centralized.
[ ] Secrets are loaded from environment variables.
[ ] Database errors are handled appropriately.
[ ] Validation failures return understandable errors.
[ ] Internal stack traces are not exposed in production responses.
[ ] Unexpected errors do not crash the server unnecessarily.

Inspect the implementation and test invalid requests.

========================================================
PHASE 4: AUDIT PART 2 — FRONTEND DEVELOPMENT
MAXIMUM: 30 MARKS
========================================================

A. LOGIN AND REGISTRATION — 8 MARKS

Verify:

[ ] Login page exists.
[ ] Registration page exists.
[ ] Forms validate required fields.
[ ] Invalid input displays useful errors.
[ ] Authentication errors are displayed.
[ ] Successful login redirects appropriately.
[ ] Authentication state is handled correctly.
[ ] Protected routes behave correctly.
[ ] Refreshing a protected page behaves correctly.
[ ] Logout works and prevents further authenticated use of an
    invalidated or expired session according to the chosen strategy.

Execute the actual frontend workflows.

Do not award marks simply because the forms render.

B. DASHBOARD — 10 MARKS

Verify the dashboard displays:

[ ] Total task count.
[ ] Pending task count.
[ ] In-progress task count.
[ ] Completed task count.
[ ] Task list.
[ ] Task status.
[ ] Task priority.

Create test tasks in different statuses and compare the displayed
counts with the actual database records.

Verify:

- Counts update after task creation.
- Counts update after status changes.
- Counts update after deletion.
- Empty-state behavior is correct.
- Loading states work.
- API errors are displayed.
- Dashboard statistics are not hardcoded.
- Counts do not include another user's private tasks.

C. TASK MANAGEMENT — 12 MARKS

Verify:

[ ] Users can add tasks.
[ ] Users can edit tasks.
[ ] Users can delete tasks.
[ ] Users can view task details.
[ ] Users can filter by status.
[ ] Users can filter by priority.
[ ] Users can search by title.
[ ] Loading states exist.
[ ] Error states exist.

For each operation:

1. Open the actual page.
2. Perform the action.
3. Inspect the API request.
4. Verify the API response.
5. Verify database persistence.
6. Refresh the page.
7. Confirm the change persists.
8. Test an invalid or failed request.
9. Verify the interface handles the failure correctly.

Check that buttons and forms are genuinely functional.

Report dead buttons, placeholder handlers, broken navigation,
and operations that update only local state without persistence.

========================================================
PHASE 5: AUDIT PART 3 — DATABASE DESIGN
MAXIMUM: 10 MARKS
========================================================

Inspect the actual Mongoose User and Task models.

Verify:

[ ] User model exists.
[ ] Task model exists.
[ ] Required fields are defined.
[ ] Appropriate field types are used.
[ ] Schema validation is implemented.
[ ] User-to-task relationship is defined.
[ ] Every task is associated with its owner.
[ ] Timestamps are implemented correctly.
[ ] Suitable indexes exist.
[ ] Email uniqueness is handled correctly.
[ ] Password hashing is correctly implemented.
[ ] Password hashes are excluded from inappropriate responses.

Inspect actual indexes rather than merely assuming that indexes
exist because they are described in documentation.

Verify that ownership queries use the authenticated user's identity.

Check for:

- Missing fields.
- Incorrect field types.
- Inconsistent enums.
- Invalid references.
- Incorrect timestamps.
- Unnecessary duplicate indexes.
- Incorrect database queries.
- Data integrity problems.

Explain whether the schema supports the required application
behavior.

========================================================
PHASE 6: AUDIT PART 4 — ADVANCED FEATURES
MAXIMUM: 15 MARKS
========================================================

A. PAGINATION — 5 MARKS

Verify that GET /api/tasks supports backend pagination.

Test:

- First page.
- Second page.
- Last page.
- Empty dataset.
- Out-of-range page.
- Invalid page number.
- Invalid page size.
- Total record count.
- Total page count.
- Correct records per page.

Check that pagination occurs on the backend rather than by fetching
all records and slicing them in the browser.

Verify that pagination metadata is correct.

B. SORTING — 3 MARKS

Verify sorting by:

- Creation date.
- Due date.

Test ascending and descending order if supported.

Verify that the returned order is correct.

Check handling of missing due dates.

Ensure arbitrary client-supplied sort fields cannot create unsafe
database queries.

C. JWT EXPIRATION AND LOGOUT — 3 MARKS

Verify:

- JWT expiration is configured.
- Expired tokens are rejected.
- Logout is implemented.
- Authentication state is cleared on logout.
- Protected routes are inaccessible after logout.
- Expired sessions are handled correctly.
- Refresh-token behavior, if implemented, is secure.

If the application uses stateless JWTs, distinguish between
clearing the client session and actual server-side token revocation.

Do not claim immediate token invalidation unless the implementation
actually supports it.

D. REUSABLE REACT COMPONENTS AND CUSTOM HOOKS — 4 MARKS

Inspect the real source code.

Verify:

- Reusable React components exist.
- Components are reused where appropriate.
- Components have clear responsibilities.
- Custom hooks exist where appropriate.
- Hooks encapsulate meaningful reusable logic.
- API and UI concerns are reasonably separated.
- There is no unnecessary duplication.
- Components are readable and maintainable.

Identify the exact reusable components and custom hooks.

Do not award full marks merely because a file is named useTasks.js
or a component is named TaskCard.jsx.

Verify that the abstractions actually provide reusable functionality.

========================================================
PHASE 7: AUDIT PART 5 — TESTING AND CODE QUALITY
MAXIMUM: 15 MARKS
========================================================

A. BACKEND API TESTS — 5 MARKS

Inspect and execute the existing backend test suite.

Verify tests cover:

- Registration.
- Login.
- Task creation.
- Task listing.
- Task retrieval.
- Task updating.
- Task deletion.
- Invalid input.
- Authentication failures.
- Authorization failures.
- Cross-user task access prevention.

Run the tests and report the actual results.

Identify missing test cases.

Do not mark authorization testing as complete if tests only verify
that unauthenticated requests are rejected.

Tests must also verify that an authenticated user cannot access
another user's tasks.

B. FRONTEND TESTS — 3 MARKS

Verify the existence and quality of component or interaction tests.

Look for tests covering:

- Form validation.
- Login behavior.
- Registration behavior.
- Task creation.
- Task updates.
- Task filtering.
- Error handling.
- Loading states.

Execute the tests.

Report passing, failing, skipped, and unexecuted tests separately.

C. CLEAN PROJECT STRUCTURE — 3 MARKS

Inspect:

- Folder organization.
- Separation of concerns.
- Controller and route responsibilities.
- Mongoose model design.
- Reusable components.
- Custom hooks.
- Naming consistency.
- Readability.
- Error handling.
- Duplicate code.
- Dead code.
- Unused dependencies.

Identify concrete problems rather than giving a generic assessment.

D. README — 2 MARKS

Verify that README.md contains accurate instructions for:

- Installing dependencies.
- Configuring MongoDB.
- Configuring environment variables.
- Running the backend.
- Running the frontend.
- Running tests.

Follow the instructions where feasible.

Identify incorrect commands, missing prerequisites, and missing
configuration details.

E. .env.example AND GIT — 2 MARKS

Verify:

- .env.example exists.
- Required environment variable names are documented.
- No actual secrets are included in .env.example.
- .env is excluded from Git.
- Passwords are not committed.
- JWT secrets are not committed.
- node_modules is excluded from Git.
- Frontend and backend source code are included in the repository.
- Git status does not reveal accidental secret files.

Inspect tracked files, not just the current directory.

Do not print actual secrets in the audit report.

========================================================
PHASE 8: SUBMISSION REQUIREMENTS
========================================================

Verify each submission instruction separately.

1. GitHub repository contains both frontend and backend source code.
2. README explains installation.
3. README explains MongoDB configuration.
4. README explains how to run the application.
5. README explains how to run tests.
6. API documentation or a Postman collection is included.
7. Test credentials or a seed script are provided.
8. Screenshots of the working application are available.
9. .env files are not committed.
10. Passwords are not committed.
11. JWT secrets are not committed.
12. node_modules is not committed.

For each item, report:

- PASS
- PARTIAL
- FAIL
- UNVERIFIED

Explain the evidence supporting the status.

Distinguish between a locally prepared repository and a successfully
submitted GitHub repository.

Do not claim the repository has been submitted unless verified.

========================================================
PHASE 9: VERIFY APPLICATION-WIDE FUNCTIONALITY
========================================================

Inspect all additional features present in the project.

Examples include:

- Kanban board.
- Projects.
- Calendar.
- Activity timeline.
- Comments.
- Notifications.
- Recurring tasks.
- Time tracking.
- File attachments.
- Analytics.
- CSV export.
- Team management.
- Role-based access control.
- Dark mode.
- Saved views.
- Bulk actions.

Only audit features that exist or are explicitly required.

For every feature, verify:

- UI functionality.
- API integration.
- Database persistence.
- Validation.
- Authorization.
- Loading states.
- Error handling.
- Tests.

A feature is not fully implemented merely because its page exists.

Identify features that are:

- Fully functional.
- Partially functional.
- UI-only.
- Backend-only.
- Broken.
- Untested.
- Missing.

========================================================
PHASE 10: BUGS AND SECURITY REVIEW
========================================================

Search for:

- Hardcoded credentials.
- Exposed secrets.
- Broken authorization.
- Incorrect ownership checks.
- Missing validation.
- Unsafe database queries.
- NoSQL injection risks.
- Mass-assignment vulnerabilities.
- Incorrect HTTP status codes.
- Missing error handling.
- Broken frontend/backend integration.
- Incorrect dashboard statistics.
- Pagination errors.
- Sorting errors.
- JWT handling problems.
- Dead buttons.
- Broken navigation.
- Unhandled API failures.
- Tests that are disabled or skipped without justification.

Classify findings as:

CRITICAL
HIGH
MEDIUM
LOW
INFORMATIONAL

For each finding, provide:

- Finding ID.
- Severity.
- Affected file or endpoint.
- Reproduction steps.
- Expected behavior.
- Actual behavior.
- Impact.
- Recommended correction.

Do not claim a vulnerability exists without sufficient evidence.

Do not claim the application is entirely secure merely because
automated checks pass.

========================================================
PHASE 11: SCORING AND COMPLIANCE MATRIX
========================================================

Create a complete assessment scorecard totaling exactly 100 marks.

Use this rubric:

PART 1 — BACKEND DEVELOPMENT: 30 MARKS
- Authentication: 10
- Task CRUD API: 15
- Validation and errors: 5

PART 2 — FRONTEND DEVELOPMENT: 30 MARKS
- Login and registration: 8
- Dashboard: 10
- Task management: 12

PART 3 — DATABASE DESIGN: 10 MARKS
- User and Task models.
- Required fields and validation.
- User-to-task relationship.
- Indexes.
- Correct password handling.

PART 4 — ADVANCED FEATURES: 15 MARKS
- Pagination: 5
- Sorting: 3
- JWT expiration and logout: 3
- Reusable components and custom hooks: 4

PART 5 — TESTING AND CODE QUALITY: 15 MARKS
- Backend API tests and authorization: 5
- Frontend tests: 3
- Project structure and readability: 3
- README: 2
- .env.example and Git: 2

For every criterion, include:

| Criterion | Maximum Marks | Evidence | Status | Marks Awarded | Reason |

Award partial credit only where justified by the rubric.

Do not award marks because a feature is described in the README.

Do not award full marks to a feature that is only partially implemented.

If verification is blocked, explicitly identify the uncertainty.

Calculate the estimated score out of 100.

Check the arithmetic carefully.

Explain the strongest and weakest assessment sections.

The score is an estimate based on the supplied rubric, not an official
score awarded by IPTechie.

========================================================
PHASE 12: FIX CONFIRMED DEFECTS
========================================================

After completing the initial audit and recording the baseline:

Fix confirmed defects when safe and within scope.

Prioritize:

P0:
- Broken mandatory assessment requirements.
- Authentication failures.
- Cross-user data exposure.
- Exposed secrets.
- Critical authorization issues.

P1:
- Broken task CRUD.
- Missing validation.
- Incorrect database relationships.
- Broken pagination.
- Broken sorting.
- Incorrect dashboard counts.
- Missing required tests.

P2:
- Frontend interaction failures.
- Loading and error-state defects.
- Documentation problems.
- Code-quality problems.

P3:
- Cosmetic problems.
- Optional feature defects.

Do not rewrite the entire application without a compelling reason.

Do not add unrelated features.

Do not weaken tests.

Do not modify the assessment rubric.

After every fix:

1. Run the relevant test.
2. Verify the fix.
3. Run regression tests.
4. Record the result.

If a fix cannot be completed, explain why and provide the next action.

========================================================
PHASE 13: FINAL VERIFICATION
========================================================

After fixing confirmed defects:

- Rerun backend tests.
- Rerun frontend tests.
- Rerun production builds.
- Rerun authorization tests.
- Verify required API endpoints.
- Verify task CRUD.
- Verify search and filters.
- Verify pagination.
- Verify sorting.
- Verify JWT expiration and logout.
- Verify dashboard counts.
- Check README instructions.
- Check .env.example.
- Check Git status.
- Review unresolved defects.

Compare the final results with the original baseline.

Do not report a fix as successful unless the relevant verification
has been performed.

========================================================
PHASE 14: FINAL REPORT
========================================================

Produce the following sections.

A. EXECUTIVE SUMMARY

Include:

- Overall assessment compliance.
- Estimated marks out of 100.
- Mandatory requirements passed.
- Mandatory requirements partially satisfied.
- Mandatory requirements failed.
- Requirements not verified.
- Tests passed.
- Tests failed.
- Tests skipped.
- Tests not executed.
- Production build status.
- Most serious defects.

B. COMPLETE IPTECHIE COMPLIANCE MATRIX

List every individual requirement with:

- Requirement.
- Maximum marks.
- Implementation evidence.
- Verification method.
- Result.
- Marks awarded.
- Defect or limitation.

C. FUNCTIONALITY AUDIT

List every implemented feature and its status across:

- Frontend.
- Backend.
- Database.
- Authorization.
- Testing.

D. SECURITY AUDIT

List confirmed security findings with severity, reproduction steps,
impact, and remediation status.

E. TEST REPORT

List commands executed and actual results.

F. SUBMISSION CHECKLIST

Verify every submission instruction.

G. BUGS FIXED

List the confirmed defects fixed and tests rerun.

H. REMAINING ISSUES

Separate:

- Mandatory issues blocking submission.
- Strongly recommended fixes.
- Optional improvements.

I. FINAL VERDICT

Choose exactly one:

1. READY FOR SUBMISSION
2. READY AFTER MINOR FIXES
3. NOT READY — MANDATORY REQUIREMENTS FAIL
4. INCONCLUSIVE — INSUFFICIENT VERIFICATION

Justify the verdict using concrete evidence.

Do not choose READY FOR SUBMISSION if a mandatory requirement is
known to be broken or a critical security issue remains unresolved.

If important requirements remain unverified, clearly state that
limitation.

========================================================
BEGIN NOW
========================================================

Inspect the existing repository.

Establish the baseline.

Verify every assessment requirement individually.

Run actual tests and workflows.

Create the compliance matrix.

Fix confirmed defects where safe.

Rerun the relevant tests.

Deliver the complete report.

Be strict, evidence-based, and honest.

The purpose is to determine whether the current application is
genuinely ready for the IPTechie assessment, not merely whether
its source code looks complete.
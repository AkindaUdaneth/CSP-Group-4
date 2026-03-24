# QA Test Report: SCRUM-80 (Transactional CRUD Testing)

**Tester:** Lead QA\
**Date:** March 24, 2026\
**Environment:** Local Development (Azure DB Connected)\
**Feature:** Practice Sessions Management\
**Status:** ✅ Manual Testing Complete | 0 Bugs Found

## Executive Summary
Executed manual testing for the Practice Sessions CRUD workflow. The system successfully handled all four primary database operations (Create, Read, Update, Delete) without throwing any frontend or backend errors. Data persistence in the Azure SQL database was verified.

## Test Execution Log

| Test ID | Scenario | Pre-Conditions | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-80.1** | **CREATE:** Add a new session | Logged in as Admin, on the Practice Sessions tab. | System saves the session, shows a success message, and adds it to the table below. | Matched expected result. | ✅ PASS |
| **TC-80.2** | **READ:** Verify data displays | TC-80.1 passed. | The newly created "Morning Drill" session for Monday is visible with the correct times. | Matched expected result. | ✅ PASS |
| **TC-80.3** | **UPDATE:** Edit an existing session | TC-80.1 passed. | System updates the session, shows a success message, and the table reflects the new 1:00 PM time. | Matched expected result. | ✅ PASS |
| **TC-80.4** | **DELETE:** Remove a session | TC-80.1 passed. | System deletes the session, shows a success message, and it disappears from the table. | Matched expected result. | ✅ PASS |

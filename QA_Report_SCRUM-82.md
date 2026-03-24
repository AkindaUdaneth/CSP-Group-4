# QA Test Report: SCRUM-82 (Data Boundary Checks)

**Tester:** Lead QA (IT23750210 - K.H.G.A.Udaneth)\
**Date:** March 24, 2026\
**Environment:** Local Development\
**Status:** ⚠️ Completed with 1 Critical Logic Bug Found

## Executive Summary
Performed boundary and "stress" testing on the Registration and Practice Session forms. While the database handled special characters and long strings gracefully, a significant logic flaw was discovered in the Practice Session duration validation.

## Test Execution Log

| Test ID | Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-82.1** | **String Overflow:** 50+ Chars | System limits input or handles length gracefully. | System accepted 50+ characters and sent for approval without error. | ✅ PASS* |
| **TC-82.2** | **Empty Submission** | Validation prevents empty spaces/blank fields. | Form blocked submission; validation messages appeared. | ✅ PASS |
| **TC-82.3** | **Logical Time Boundary** | Prevents Start Time being after End Time. | **BUG:** System allowed a session to be added where Start Time > End Time. | ❌ FAIL |
| **TC-82.4** | **Special Characters** | Sanitize SQL/XSS characters. | No database or script execution errors; handled as literal text. | ✅ PASS |
| **TC-82.5** | **Numeric Boundary** | Prevent negative/zero values. | System correctly rejected invalid numeric inputs. | ✅ PASS |

_*Note: Recommend adding a frontend maxLength limit for UI consistency._

## Bug Report: SCRUM-82-B1 (Time Logic Error)
- **Description:** Users can create practice sessions where the end time occurs before the start time.
- **Impact:** High. Causes logical corruption in schedules and calendars.
- **Suggested Fix:** Add a comparison check in the `handleSubmit` function of `PracticeSessionManagement.js`.

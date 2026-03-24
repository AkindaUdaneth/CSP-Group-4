# QA Test Report: SCRUM-77 (Permissions Matrix & RBAC)

**Tester:** Lead QA (IT23750210 - K.H.G.A.Udaneth)\
**Date:** March 24, 2026\
**Environment:** Local Development (React + C# Backend)\
**Feature:** Role-Based Access Control (RBAC)\
**Status:** ✅ 100% Passed | Security Verified

## Executive Summary
Successfully verified the Role-Based Access Control (RBAC) implementation. The system effectively restricts access to sensitive administrative features based on the user's role assigned in the authentication token. Privilege escalation attempts via direct URL manipulation were successfully mitigated by the frontend routing logic.

## Permissions Matrix (Target vs. Reality)

| Feature / Page | Visitor | Player | Admin | Result |
| :--- | :---: | :---: | :---: | :--- |
| **Landing Page** | ✅ | ✅ | ✅ | **Matched** |
| **Registration Form** | ✅ | ❌ | ❌ | **Matched** |
| **Player Dashboard** | ❌ | ✅ | ✅ | **Matched** |
| **Admin Panel** | ❌ | ❌ | ✅ | **Matched** |
| **Practice Management**| ❌ | ❌ | ✅ | **Matched** |

## Test Execution Log

| Test ID | Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-77.1** | **Unauthorized Access (Visitor)** | Direct navigation to `/admin` redirects to `/login`. | Successfully redirected to login page. | ✅ PASS |
| **TC-77.2** | **Privilege Escalation (Player)** | Logged-in Player attempting to access `/admin` is sent to `/dashboard`. | Security logic triggered; redirected to Player Dashboard. | ✅ PASS |
| **TC-77.3** | **Admin Authority** | Admin role can access all tabs (Practice, Approvals, Bracket). | Full access granted; components rendered correctly. | ✅ PASS |
| **TC-77.4** | **Token Invalidation** | Deleting local storage token mid-session forces a logout. | Session terminated immediately upon navigation attempt. | ✅ PASS |

## Technical Implementation Notes
Access control is enforced via the `isAdminRole` utility function, which handles case-insensitivity and whitespace normalization for the `admin` and `systemadmin` strings.

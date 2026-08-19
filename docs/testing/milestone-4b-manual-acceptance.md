# Milestone 4B Manual Browser Acceptance

Run this checklist after automated checks pass. Reuse persistent User A and User B accounts. These
steps are prepared for the developer and are not claimed as executed by the automated review.

## Startup

1. Start PostgreSQL: `docker compose up -d postgres`.
2. From `apps/api`, run `uv run alembic upgrade head` and `uv run alembic current`.
3. Confirm Alembic reports `20260818_0004 (head)`.
4. Start local Supabase: `npx --no-install supabase start --workdir .`.
5. Start FastAPI from `apps/api`: `uv run uvicorn applygauge_api.main:app --reload`.
6. Start Next.js from the repository root: `npm run dev:web`.

## User A: creation and provenance

7. Sign in as User A.
8. Create a job whose description says: `We are looking for an engineer with Python, PostgreSQL, and Docker experience.`
9. Open its detail page.
10. Confirm Python, PostgreSQL, and Docker each display `Detected`.
11. Confirm there is no Detect or Extract button.
12. Add React manually and confirm it displays `Manual`.
13. Add Python manually and confirm it displays `Manual + detected`.
14. Reload and confirm all skills and labels persist.

## Description reconciliation

15. Change the description to contain Python, PostgreSQL, and Kubernetes but not Docker.
16. Save and return to job detail.
17. Confirm Docker disappeared.
18. Confirm Kubernetes and PostgreSQL display `Detected`.
19. Confirm Python remains `Manual + detected` and React remains `Manual`.
20. Remove Python from the description, save, and confirm Python becomes `Manual`.
21. Confirm React remains `Manual`.
22. Add Python back to the description, save, and confirm Python becomes `Manual + detected`.

## Durable correction

23. Remove the currently detected Kubernetes skill and confirm it disappears.
24. Edit other description text while leaving Kubernetes present, save, and confirm Kubernetes does not return.
25. Remove Kubernetes from the description, save, and confirm it remains absent.
26. Add Kubernetes back to the description, save, and confirm it still remains absent.
27. Manually add Kubernetes and confirm it displays `Manual`, not immediately `Manual + detected`.
28. Edit the description again while leaving Kubernetes present.
29. Save and confirm Kubernetes becomes `Manual + detected`.

## Clearing and unrelated changes

30. Clear the description and save.
31. Confirm detected-only skills disappear.
32. Confirm dual skills become `Manual`.
33. Confirm manually retained React, Python, and Kubernetes remain.
34. Confirm no previously removed detected skill returns.
35. Change only the title or location and save.
36. Confirm skills and provenance remain unchanged.
37. Change application status.
38. Confirm status history updates normally and skills remain unchanged.

## Extraction-policy spot checks

Use a temporary job if that keeps the main acceptance job clear.

39. Save a description containing `JavaScript`; confirm JavaScript is detected and Java is not added from that token.
40. Save a description containing `NoSQL`; confirm SQL is not detected as a substring.
41. Save a description containing `C++17`; confirm C++ is not detected from that extended token.
42. Save a description containing only `JS TS Node C`; confirm none are automatically detected.
43. Save a description containing `Node.js Next.js C# C++`; confirm all eligible standalone technologies are detected.

## User B and nondisclosure

44. Sign out User A and sign in as User B.
45. Confirm User A's job is absent from `/jobs`.
46. Visit the known User A detail URL and confirm the normal not-found response.
47. If practical, send User A skill GET, POST, and DELETE requests while authenticated as User B.
48. Confirm each returns the same safe `404` and leaks no provenance or correction state.

## Return to User A and cleanup

49. Sign back in as User A and confirm the job and provenance state persisted.
50. Delete the test job and confirm its old detail URL is not found.
51. Confirm another job can still use the same global skill catalog.

## Browser and accessibility hygiene

52. Inspect the browser console and confirm no hydration warnings or unexpected 500 responses.
53. Treat intentional privacy-preserving 404 traffic as expected.
54. Check the job detail Skills section at a narrow/mobile viewport.
55. Confirm long skill names, provenance text, and Remove controls remain usable without overflow.
56. Keyboard-test Add and Remove, including readable pending states.
57. Confirm provenance remains understandable without color.
58. Confirm no access token, raw API error, correction state, or other internal detail is disclosed.

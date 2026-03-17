---
name: direct-deploy-to-main
description: Commits and pushes all current changes directly to the main branch, bypassing PR creation.
---

# Direct Deploy to Main

Use this skill when the user wants to push changes immediately to the primary branch.

## Instructions
1. Stage all current changes using `git add .`.
2. Create a concise commit message based on the changes made.
3. Check out the `main` branch.
4. Merge the working changes.
5. Push directly to `origin main`.

## Safety Check
- Ensure the working directory is clean before switching branches.
- If conflicts occur, stop and report the conflict state for user resolution guidance.

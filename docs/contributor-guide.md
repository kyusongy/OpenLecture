# OpenLecture Contributor Guide

This repository is the free, open-source edition in the EasyPine product
family.

## Product Boundary

OpenLecture must stay focused on local-first lecture capture:

- real-time transcription
- real-time translation
- manual notes
- local course and lecture management
- local file storage
- DashScope region and API-key configuration

OpenLecture must not ship hosted premium workflows:

- AI note generation
- grounded lecture chat
- review, quiz, flashcards, or mastery systems
- uploads and cloud material retrieval
- billing, subscriptions, referrals, or usage quotas
- account system or multi-device sync

If a feature belongs to the paid edition, do not add a disabled placeholder in
the free UI. Keep the free workflow clean.

## Source Of Truth

- UI and backend behavior in this repository define what OpenLecture currently
  does.
- `docs/edition-matrix.md` defines the boundary with EasyPine.
- Marketing or README changes should be updated in the same change as product
  behavior when they describe current capability.

## Runtime Baseline

- Python: `3.10.13`
- Frontend: Node-based Vite app
- Desktop shell: Tauri

## Local Data Expectations

OpenLecture stores lectures, transcripts, notes, and settings on the user's
machine. Contributor changes must preserve that assumption unless there is an
explicit product decision to change it.

Key expectations:

1. data location should stay visible to the user
2. region selection should stay explicit
3. setup and error states should explain local-only behavior clearly

## Safe Contribution Rules

1. Prefer improvements that reduce setup friction or improve reliability.
2. Do not introduce remote dependencies just to mimic EasyPine.
3. Keep diagnostic states actionable: missing key, wrong region, backend down,
   or local storage path issues should all explain the next step.
4. When sharing code concepts with EasyPine, reuse low-level transcript logic
   and protocol rules, not premium workflows.

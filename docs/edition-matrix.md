# OpenLecture vs EasyPine

This document protects the free edition from feature creep and keeps the
upgrade path honest.

## Product Intent

- `OpenLecture`: free, open-source, local-first lecture companion that runs on
  the user's machine with one DashScope key.
- `EasyPine`: hosted product for users who want AI study workflows, cloud sync,
  and a paid supportable service.

## What OpenLecture Must Keep

- Real-time lecture transcription
- Real-time translation
- Manual notes next to the transcript
- Course and lecture management
- Fully local file storage
- Simple setup with visible data path and region choice

## What Stays Out Of OpenLecture

- Hosted AI note generation
- Grounded lecture chat and cross-lecture retrieval
- Review generation, spaced repetition, quiz, flashcards, mastery tracking
- Upload ingestion for YouTube or files
- Billing, referrals, credits, and quota packs
- Cloud sync and shared account state

## Why The Split Exists

- The free edition should solve lecture capture well without hidden lock-in.
- The paid edition should justify itself with workflows that require hosted AI,
  cloud state, and ongoing operating cost.
- The boundary needs to be visible in the UI and in the docs so contributors do
  not accidentally backport premium-only features.

## Shared Implementation Candidates

- Language pair lists
- Transcript schemas
- Transcript merge and dedupe rules
- Auto-pause behavior
- Streaming test fixtures

## Current Module Sequence

1. Boundary and trust layer
2. Source-of-truth docs
3. Real-time architecture cleanup
4. AI trust layer for EasyPine only
5. Reliability, testing, and observability

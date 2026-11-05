# Longevity combined website review

Three source tabs:11 uploaded Pages.dev images,19 dot-com homepage sections,12 Julie Masterclass sections.

Select any12 or fewer sections across all tabs, assign unique global positions1–12, write comments, and build a single mixed screenshot sequence. This is a planning composition, not a deployment of changes to the live source websites. Comments remain beside each selected section.

`Send review` submits an immutable snapshot to this review workspace and verifies the stored receipt. It does not send email or change GitHub/source websites. Draft autosave restores the same visitor's state. Downloads and v1–v4 backup imports remain available.

Backend: `backend/server.py`, FastAPI/uvicorn, port8874. The preview deployment substitutes `__PORT_8874__` in index.html. Data lives outside the deployed/source folder at `/home/user/workspace/website-review-data/reviews.sqlite3`. Do not commit that database.

The backend scopes drafts and submissions by the platform's X-Visitor-Id. Local testing uses a browser-local header only on loopback. Server persistence is workspace-backed, not automatic cross-device identity sync. The backend must remain running for online save/send; downloadable backups work independently.

No source-site payments, CRM requests, Meta events or production-site edits are part of this review board.

# Backup State Before Room Booking Refactor

This file details the state of the codebase right before implementing the structured Room Booking and Availability workflow.

## Purpose of this File
This document serves as a snapshot of how the system worked *before* we linked `Session` explicitly to `RoomBooking` and `Room` to track available timeslots. If you need to revert to this simpler state, use `git checkout` or revert the changes mentioned here.

## Previous State Summary

### Database Schema (`auth-backend/prisma/schema.prisma`)
- `Room`: Had basic properties (`id`, `name`, `capacity`, etc.) but **did not** have an `availability` field to define working hours.
- `Session`: Was linked only to `Course`. It **did not** have `roomId`, `location`, or `topic` fields.
- `RoomBooking`: Existed but was completely disconnected from the Course Creation flow.

### Backend APIs (`auth-backend/src/`)
- `institute.service.ts -> createCourse`: It accepted a `sessions` array. It tried to write `location` and `topic` into the `Session` creation logic, which actually caused a **400 Bad Request error** because those fields weren't in the database schema.
- Creating a Course **did not** automatically create a `RoomBooking` or link the sessions to it.

### Frontend (`src/app/institute/`)
- `halls/page.tsx`: Basic form to add a hall. No UI to set working hours / availability periods.
- `courses/create/page.tsx`: Simply let you pick a `hallId` from a dropdown, but the selected dates/times were completely unvalidated against the room's actual schedule or other bookings.

## How to Revert
If you wish to return to this exact state, you can use git:
```bash
git checkout <commit_hash_before_these_changes>
```
If you don't use git, you would need to:
1. Remove `availability Json?` from `Room` model in `schema.prisma`.
2. Remove `roomId`, `location`, `topic` from `Session` model.
3. Remove the RoomBooking creation logic from `institute.service.ts -> createCourse`.
4. Remove the availability endpoint from the routing.
5. Remove the availability UI sections from the frontend `courses/create/page.tsx` and `halls/page.tsx`.

# Team Chat Project

## Product

This repository contains a standalone Team Chat application.

The Team Chat will eventually become Product #1 inside a larger Workplace platform.

## Current scope

Build ONLY Team Chat.

Do NOT build:

- Workplace platform
- Company management
- Authentication system
- CRM
- ERP
- HR
- Finance
- Tasks
- AI agents
- AI assistant

Authentication and organization management will eventually be provided by the Workplace platform.

For the current development phase, use mock users and mock workplace data.

## Architecture

Frontend:

- React
- Vite
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query
- React Router
- Lucide React

Backend:

- NestJS
- TypeScript
- PostgreSQL
- Prisma
- Redis
- Socket.IO

## Frontend structure

apps/web/src/

app/
components/
features/
hooks/
lib/
mocks/
services/
stores/
types/
utils/

## Backend structure

apps/api/src/

common/
chat/
attachments/
notifications/
presence/
search/
realtime/

## Team Chat features

The product will eventually support:

- Channels
- Public channels
- Private channels
- Direct messages
- Group conversations
- Messages
- Threads
- Replies
- Reactions
- Mentions
- Message editing
- Message deletion
- Pinned messages
- File attachments
- Search
- Notifications
- Presence
- Typing indicators
- Read receipts

## Development rule

Build incrementally.

Do not create unnecessary features.

Do not redesign existing UI unless explicitly requested.

Do not introduce authentication into Team Chat.

Use mock data during the UI development phase.

Keep the architecture ready for future Workplace integration.

## Future integration

The future Workplace platform will provide:

- Authentication
- Users
- Organizations
- Roles
- Permissions
- Workplace identity

Team Chat will consume those identities rather than owning them.

Use workplaceId and userId references in Team Chat data models.

## Code quality

Write production-quality TypeScript.

Prefer small reusable components.

Avoid giant components.

Keep business logic separate from UI.

Use strict typing.

Do not use any unless absolutely necessary.

Do not hard-code API URLs.

Use environment variables.

Do not store secrets in source code.

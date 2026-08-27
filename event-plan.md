# Event System

## Context

The bot currently has a one-off, hardcoded "Hunger Games" event hack: `src/events/guildScheduledEventUserAdd.ts` checks `event.id === '1436429199106773062'` and tracks up to 24 sign-ups in a Flashcore array, with no waitlist promotion, no announcements, and no admin tooling. `guildScheduledEventCreate.ts` and `guildScheduledEventUserRemove.ts` are empty stubs. The goal is to replace this with a generic, DB-backed event system that admins can use to create, edit, and cancel events for any future use, built on Discord's native Guild Scheduled Events.

Decisions confirmed with the user:

- Admin commands create the **native Discord Scheduled Event** directly (shows in Discord's own event UI), with a DB row as the source of truth for capacity/location/etc.
- Location is free text for both `server` and `in_person` types (no validation against the tracked server list).
- Sign-up uses Discord's **native "Interested" RSVP** (`guildScheduledEventUserAdd`/`UserRemove`) rather than custom buttons. The bot can't forcibly remove someone's native RSVP, so capacity is enforced as a **soft cap**: everyone can click Interested in Discord, but the bot's DB tracks `confirmed` vs `waitlist` and DMs waitlisted users accordingly. When a confirmed spot frees up, the earliest waitlisted user is promoted and DMed.
- Admin-only — only admin commands create/edit/cancel events.

## Database

Add to `schema.sql`:

```sql
CREATE TABLE events (
    event_id BIGINT UNSIGNED PRIMARY KEY, -- discord guild scheduled event id
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location_type ENUM('server','in_person') NOT NULL,
    location TEXT,
    max_capacity INT UNSIGNED, -- NULL = unlimited
    start_time TIMESTAMP NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    reminded_7d BOOLEAN NOT NULL DEFAULT false,
    reminded_12h BOOLEAN NOT NULL DEFAULT false,
    status ENUM('scheduled','cancelled','completed') NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_signups (
    event_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    status ENUM('confirmed','waitlist') NOT NULL DEFAULT 'confirmed',
    signed_up_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);
```

Also seed a new `guild_settings` row for the events feature (announcement channel), following the existing `welcome_message` row pattern: `INSERT INTO guild_settings (id, setting) VALUES ('events', JSON_OBJECT('channelid', NULL));`

## Types

- `src/utill/types/database/events.ts` — `db_event`, `db_event_signup` (mirror column shapes, snake_case, matching `db_bans`-style files).
- `src/utill/types/settings/events.ts` — `event_settings = { setting: { channelid: string } }`, matching the `welcome_settings` shape (`channelid` field name, for consistency with the existing convention). Export from `src/utill/types/settings/index.ts`.

## Channel configuration — reuse the existing generic settings command

No bespoke channel-setter command. The repo already has a generic settings editor: `src/commands/admin/settings.ts` lets an admin pick a setting id from a `choices` list (`welcome_message`, `roles`, `modmail`) and edit its raw JSON via a modal (`modal-settings_update.ts` → `updateSettings`). Add `{ name: 'event settings', value: 'events' }` to that `choices` array — admins then set `channelid` the same way they already configure the welcome channel. All feature code reads it the same way other features do: `(await getSettingByid('events')) as event_settings`.

## Database helpers — `src/utill/functions/database/events.ts`

Follow the `bans.ts` try/catch + `log.error()` pattern, exported via `database/index.ts`:

- `createEvent(data)` — insert row, return `db_event`
- `getEventById(eventId)` / `listUpcomingEvents()` (status = 'scheduled', start_time > now)
- `updateEvent(eventId, fields)` / `cancelEvent(eventId)` (status = 'cancelled')
- `getEventsNeedingReminder(windowMs, field)` — for the 7d/12h job
- `markReminderSent(eventId, field)`
- `addSignup(eventId, userId, status)` / `removeSignup(eventId, userId)`
- `getSignupsByEvent(eventId)` (returns confirmed + waitlist, ordered by `signed_up_at`)
- `getConfirmedCount(eventId)`
- `promoteNextWaitlisted(eventId)` — moves earliest waitlist row to confirmed, returns the promoted `user_id` or null

## Admin commands — `src/commands/admin/event/`

Group folder `event`, mirroring `admin/modmail/channel.ts`'s pattern (`createCommandConfig`, `defaultMemberPermissions`):

- **`create.ts`** — options: `name` (string), `description` (string), `start-time` (string, format documented in description e.g. `YYYY-MM-DD HH:mm`, parsed/validated as a future date), `location-type` (choice: Server / In Person), `location` (string), `capacity` (integer, optional). Flow: validate date → `guild.scheduledEvents.create(...)` (entity type `External`, with `entityMetadata.location` set to the location string) → `createEvent()` DB insert keyed by the new Discord event's id → post announcement embed to the channel from `(await getSettingByid('events')) as event_settings` (`.setting.channelid`) → ephemeral confirmation reply.
- **`edit.ts`** — options: `event` (string/autocomplete from `listUpcomingEvents()`), plus optional name/description/start-time/location-type/location/capacity. Updates both the Discord event (`.edit()`) and the DB row. If capacity is increased, calls `promoteNextWaitlisted()` in a loop until either the waitlist is empty or new capacity is reached, DMing each promoted user.
- **`cancel.ts`** — options: `event`. Sets the Discord event status to `Cancelled` via `.setStatus()`, marks DB `status = 'cancelled'`, DMs all confirmed + waitlisted users that the event was cancelled.

## Public commands

- **`src/commands/event/list.ts`** — lists upcoming events (name, time, location, confirmed/capacity) from `listUpcomingEvents()`.
- **`src/commands/event/info.ts`** — options: `event`. Shows full details plus the full attendee list and waitlist (mentioning each `user_id`), satisfying "all members should be listed."

## Discord event handlers

- **`src/events/guildScheduledEventCreate.ts`** — leave as a log line; all DB/announcement work happens inline in `admin/event/create.ts` so behavior isn't split across two files.
- **`src/events/guildScheduledEventUserAdd.ts`** — replace the hardcoded Hunger Games block entirely:
  1. `getEventById(event.id)`; if null (not a bot-tracked event), return.
  2. If event is cancelled, return.
  3. `getConfirmedCount(event.id)` vs `max_capacity`: if room (or unlimited), `addSignup(event.id, user.id, 'confirmed')`.
  4. Else `addSignup(event.id, user.id, 'waitlist')` and DM the user: "This event is full, but you're welcome to come spectate — we'll let you know if a space opens up."
- **`src/events/guildScheduledEventUserRemove.ts`** — implement:
  1. `getEventById(event.id)`; if null, return.
  2. `removeSignup(event.id, user.id)`.
  3. If the removed user was `confirmed`, call `promoteNextWaitlisted(event.id)`; if it returns a user id, DM them: "A spot opened up for {event.name} — you're confirmed!"

## Reminder job — `src/events/clientReady/eventReminderJob.ts`

New `toad-scheduler` `AsyncTask` + `CronJob` (mirroring `playerMsgUpdateJob.ts`), running every ~10 minutes:

- Query `getEventsNeedingReminder` for events starting in the next 7 days (and not yet `reminded_7d`) → post hype announcement to the announcement channel, `markReminderSent(eventId, 'reminded_7d')`.
- Same for the 12-hour window with `reminded_12h`.

## Help command

Add the new `/event list`, `/event info`, and `/admin/event *` commands to `src/commands/help.ts` documentation, following the existing pattern for other command groups.

## Verification

- `npm run lint:style` for formatting.
- `npm run dev`, then in a test guild:
  1. `/admin/settings` with the new `event settings` choice to set `channelid` to the announcement channel.
  2. `/admin/event create` with a near-future start time and small capacity (e.g. 2) — confirm the native Discord event appears and the announcement posts.
  3. Have 3+ test accounts click "Interested" on the Discord event — confirm the 3rd gets a "full, welcome to spectate" DM, and `/event info` shows 2 confirmed + 1 waitlisted.
  4. Un-click "Interested" for a confirmed user — confirm the waitlisted user gets promoted and DMed, and `/event info` reflects the change.
  5. `/admin/event edit` to raise capacity — confirm any remaining waitlisted users get promoted.
  6. `/admin/event cancel` — confirm the Discord event shows cancelled and all sign-ups get a cancellation DM.
  7. Manually trigger (or wait for) the reminder job logic against a fixture event to confirm 7-day/12-hour announcements fire once each.

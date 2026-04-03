alter table public.events
add column if not exists extra_data jsonb not null default '{}'::jsonb;

alter table public.event_participants
add column if not exists extra_data jsonb not null default '{}'::jsonb;

comment on column public.events.extra_data is
'Flexible event configuration such as allowed study years, multiple experience slider prompts, or future event-specific settings.';

comment on column public.event_participants.extra_data is
'Flexible participant answers for event-specific questions such as experience slider responses.';

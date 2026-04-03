alter table public.events
add column if not exists extra_data jsonb not null default '{}'::jsonb;

alter table public.events
add column if not exists square_image text;

alter table public.event_participants
add column if not exists extra_data jsonb not null default '{}'::jsonb;

comment on column public.events.extra_data is
'Flexible event configuration such as allowed study years, multiple experience slider prompts, multiple yes/no questions, or future event-specific settings.';

comment on column public.events.square_image is
'Optional square event image used for compact cards, thumbnails, and other non-banner event surfaces.';

comment on column public.event_participants.extra_data is
'Flexible participant answers for event-specific questions such as experience slider responses and yes/no answers.';

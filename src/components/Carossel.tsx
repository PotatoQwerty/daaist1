"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { formatEventDate } from "@/lib/event-date";
import { getEventPath } from "@/lib/event-path";

type CarouselEvent = {
  id: string;
  title?: string | null;
  description?: string | null;
  cover_image?: string | null;
  square_image?: string | null;
  start_date?: string | null;
  location?: string | null;
  is_public?: boolean | null;
};

/**
 * Card body, shared by the public and private branches. Previously these
 * were two near-identical copies that had already drifted apart.
 */
function EventBody({ event }: { event: CarouselEvent }) {
  return (
    <>
      <div className="relative h-44 w-full overflow-hidden border-b border-border">
        <Image
          src={event.cover_image || "/images/banner.jpg"}
          alt=""
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          fill
          className="object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg leading-snug font-bold text-foreground">
          {event.title}
        </h3>

        {/* Date and place are values, so they sit in the annotation face
            rather than being decorated with icons inside the image. */}
        <p className="annot mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            {formatEventDate(event.start_date, "TBA")}
          </span>
          {event.location && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
        </p>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {event.description}
        </p>
      </div>
    </>
  );
}

export default function Carossel({ data }: { data: CarouselEvent[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          No events scheduled right now. Clubs post theirs here once dates are
          set.
        </p>
      </div>
    );
  }

  return (
    <Swiper
      modules={[Pagination, Navigation, Autoplay]}
      spaceBetween={24}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      breakpoints={{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
      className="w-full pb-12"
    >
      {data.map((event) => (
        <SwiperSlide key={event.id} className="h-auto">
          {event.is_public ? (
            <Link
              href={getEventPath(event)}
              className="group/card flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors duration-200 hover:border-domain-clubs"
            >
              <EventBody event={event} />
              <span className="inline-flex items-center gap-2 px-5 pb-5 text-sm font-bold text-accent-ink">
                View event
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover/card:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ) : (
            <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
              <EventBody event={event} />
              <span className="annot px-5 pb-5">Private event</span>
            </div>
          )}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

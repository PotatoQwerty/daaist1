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

export default function Carossel({ data }: { data: CarouselEvent[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30">
        <p className="text-muted-foreground font-medium">
          No upcoming events found.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative group">
      <Swiper
        modules={[Pagination, Navigation, Autoplay]}
        spaceBetween={24}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        breakpoints={{
          640: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 3,
          },
        }}
        className="w-full pb-12 !px-1"
      >
        {data.map((event) => (
          <SwiperSlide key={event.id} className="h-full">
            {event.is_public ? (
              <Link
                href={getEventPath(event)}
                className="group/card flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={event.cover_image || "/images/banner.jpg"}
                    alt={event.title || "event banner"}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    fill
                    className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent opacity-60" />
                  {event.square_image && (
                    <div className="absolute right-3 top-3 h-14 w-14 overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur-sm">
                      <Image
                        src={event.square_image}
                        alt={event.title || "event square image"}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="line-clamp-1 text-lg font-bold text-white">
                      {event.title}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                  <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{formatEventDate(event.start_date, "TBA")}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span className="max-w-[100px] truncate">
                          {event.location}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-primary transition group-hover/card:text-accent">
                    View event
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={event.cover_image || "/images/banner.jpg"}
                    alt={event.title || "event banner"}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent opacity-60" />
                  {event.square_image && (
                    <div className="absolute right-3 top-3 h-14 w-14 overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-lg backdrop-blur-sm">
                      <Image
                        src={event.square_image}
                        alt={event.title || "event square image"}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                    <h3 className="line-clamp-1 text-lg font-bold text-white">
                      {event.title}
                    </h3>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                      Private
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                  <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{formatEventDate(event.start_date, "TBA")}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span className="max-w-[100px] truncate">
                          {event.location}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 text-sm font-semibold text-muted-foreground">
                    Private event
                  </div>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

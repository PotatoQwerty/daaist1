"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";

export default function Carossel({ data }: { data: any[] }) {
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
        {data.map((event: any) => (
          <SwiperSlide key={event.id} className="h-full">
            <div className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all hover:border-primary/50 group/card h-full flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={event.cover_image || "/images/banner.jpg"}
                  alt={event.title || "event banner"}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  fill
                  className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent opacity-60" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-lg line-clamp-1">
                    {event.title}
                  </h3>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1 gap-3">
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
                <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {event.start_date
                        ? new Date(event.start_date).toLocaleDateString()
                        : "TBA"}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate max-w-[100px]">
                        {event.location}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

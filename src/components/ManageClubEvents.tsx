"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Plus,
  Loader2,
  X,
  Image as ImageIcon,
  QrCode,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatEventDate } from "@/lib/event-date";
import { getEventCheckInPath } from "@/lib/event-path";

type Club = {
  id: string;
};

type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  cover_image?: string | null;
  is_public?: boolean | null;
};

function ManageClubEvents({ club }: { club: Club }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    location: string;
    start_date: string;
    end_date: string;
    is_public: boolean;
    cover_image: string;
    file: File | null;
  }>({
    title: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
    is_public: true,
    cover_image: "",
    file: null,
  });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/club/event?club_id=${club.id}`);
      const data = await res.json();
      if (data.data) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    }
  }, [club.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  const processFile = (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBannerPreview(result);
      };
      reader.readAsDataURL(file);
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };
  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, cover_image: "", file: null }));
    setBannerPreview(null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();

      fd.append("club_id", club.id);
      fd.append("title", formData.title);
      fd.append("description", formData.description);
      fd.append("location", formData.location);
      fd.append("start_date", formData.start_date);
      fd.append("end_date", formData.end_date);
      fd.append("is_public", String(formData.is_public));

      if (formData.file) {
        fd.append("file", formData.file); // actual File
      }

      const res = await fetch("/api/club/event", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create event");
        return;
      }

      toast.success("Event created successfully!");
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        location: "",
        start_date: "",
        end_date: "",
        is_public: true,
        cover_image: "",
        file: null,
      });
      setBannerPreview(null);
      fetchEvents();
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (event_id: string) => {
    try {
      const res = await fetch(`/api/club/event?event_id=${event_id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete event");
        return;
      }
      toast.success("Event deleted successfully!");
      fetchEvents();
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Club Events</h3>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" /> New Event
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-4 border rounded-lg bg-card shadow-sm animate-in fade-in slide-in-from-top-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="e.g. Weekly Meeting"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g. Room 304 or Zoom"
                  className="pl-9"
                />
                <MapPin className="active-icon w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe your event..."
              className="resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                    end_date: prev.end_date || e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                min={formData.start_date || undefined}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_image">Cover Image</Label>
            {!bannerPreview ? (
              <div className="mt-2">
                <label
                  htmlFor="cover_image"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors
                    ${
                      isDragging
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/25"
                    }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      SVG, PNG, JPG
                    </p>
                  </div>
                  <Input
                    id="cover_image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
	            ) : (
	              <div className="mt-2 relative rounded-lg overflow-hidden border aspect-video group">
	                <Image
	                  src={bannerPreview}
	                  alt="Banner Preview"
	                  width={1600}
	                  height={900}
	                  unoptimized
	                  className="h-full w-full object-cover"
	                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_public: checked as boolean })
              }
            />
            <Label htmlFor="is_public" className="font-normal cursor-pointer">
              Make this event public (visible to everyone)
            </Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        </form>
      )}

      <div className="grid gap-4">
        {events.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
            No events scheduled. Create one above!
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
	              <div className="h-16 w-16 bg-muted rounded-md overflow-hidden shrink-0 relative">
	                {event.cover_image ? (
	                  <Image
	                    src={event.cover_image}
	                    alt={event.title}
	                    fill
	                    sizes="64px"
	                    className="object-cover"
	                  />
	                ) : (
                  <Calendar className="w-8 h-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{event.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {event.description}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatEventDate(event.start_date)}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </span>
                  )}
                  {event.is_public === false && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.2em]">
                      Private
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href={getEventCheckInPath(event)}>
                    <QrCode className="w-4 h-4 mr-2" />
                    Check-ins
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(event.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ManageClubEvents;

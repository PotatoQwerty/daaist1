"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Image as ImageIcon,
  Info,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatEventDate } from "@/lib/event-date";
import {
  buildEventExtraData,
  EVENT_STUDY_YEAR_OPTIONS,
  parseEventExtraData,
} from "@/lib/event-extra";
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
  square_image?: string | null;
  is_public?: boolean | null;
  extra_data?: unknown;
};

type ImageField = "banner" | "square";

type FormState = {
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  experience_topics: string[];
  experience_topic_input: string;
  yes_no_questions: string[];
  yes_no_question_input: string;
  allowed_study_years: string[];
  cover_image: string;
  square_image: string;
  bannerFile: File | null;
  squareFile: File | null;
  removeCoverImage: boolean;
  removeSquareImage: boolean;
};

const EMPTY_FORM_STATE: FormState = {
  title: "",
  description: "",
  location: "",
  start_date: "",
  end_date: "",
  is_public: true,
  experience_topics: [],
  experience_topic_input: "",
  yes_no_questions: [],
  yes_no_question_input: "",
  allowed_study_years: [...EVENT_STUDY_YEAR_OPTIONS],
  cover_image: "",
  square_image: "",
  bannerFile: null,
  squareFile: null,
  removeCoverImage: false,
  removeSquareImage: false,
};

function toDateInputValue(value?: string | null) {
  return value?.slice(0, 10) || "";
}

function createFormStateFromEvent(event?: EventItem): FormState {
  if (!event) {
    return {
      ...EMPTY_FORM_STATE,
      allowed_study_years: [...EVENT_STUDY_YEAR_OPTIONS],
      experience_topics: [],
      yes_no_questions: [],
    };
  }

  const extraData = parseEventExtraData(event.extra_data);

  return {
    title: event.title || "",
    description: event.description || "",
    location: event.location || "",
    start_date: toDateInputValue(event.start_date),
    end_date: toDateInputValue(event.end_date || event.start_date),
    is_public: event.is_public !== false,
    experience_topics:
      extraData.experiencePrompts?.map((prompt) => prompt.topic) ?? [],
    experience_topic_input: "",
    yes_no_questions:
      extraData.yesNoQuestions?.map((question) => question.question) ?? [],
    yes_no_question_input: "",
    allowed_study_years:
      extraData.allowedStudyYears?.length
        ? [...extraData.allowedStudyYears]
        : [...EVENT_STUDY_YEAR_OPTIONS],
    cover_image: event.cover_image || "",
    square_image: event.square_image || "",
    bannerFile: null,
    squareFile: null,
    removeCoverImage: false,
    removeSquareImage: false,
  };
}

type EventImageUploadFieldProps = {
  field: ImageField;
  label: string;
  hint: string;
  preview: string | null;
  isDragging: boolean;
  onDragOver: (event: React.DragEvent, field: ImageField) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent, field: ImageField) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, field: ImageField) => void;
  onRemove: (field: ImageField) => void;
};

function EventImageUploadField({
  field,
  label,
  hint,
  preview,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onChange,
  onRemove,
}: EventImageUploadFieldProps) {
  const inputId = `${field}_image`;
  const previewClassName =
    field === "banner" ? "aspect-video" : "aspect-square max-w-[240px]";

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      {!preview ? (
        <div className="mt-2">
          <label
            htmlFor={inputId}
            onDragOver={(event) => onDragOver(event, field)}
            onDragLeave={onDragLeave}
            onDrop={(event) => onDrop(event, field)}
            className={`flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50 ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25"
            }`}
          >
            <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
              <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            <Input
              id={inputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onChange(event, field)}
            />
          </label>
        </div>
      ) : (
        <div
          className={`group relative mt-2 overflow-hidden rounded-lg border ${previewClassName}`}
        >
          <Image
            src={preview}
            alt={`${label} preview`}
            width={field === "banner" ? 1600 : 800}
            height={field === "banner" ? 900 : 800}
            unoptimized
            className="h-full w-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onRemove(field)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ManageClubEvents({ club }: { club: Club }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [squarePreview, setSquarePreview] = useState<string | null>(null);
  const [draggingField, setDraggingField] = useState<ImageField | null>(null);
  const [formData, setFormData] = useState<FormState>(() =>
    createFormStateFromEvent(),
  );

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

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingEventId(null);
    setFormData(createFormStateFromEvent());
    setBannerPreview(null);
    setSquarePreview(null);
    setDraggingField(null);
  }, []);

  const openCreateForm = () => {
    setEditingEventId(null);
    setFormData(createFormStateFromEvent());
    setBannerPreview(null);
    setSquarePreview(null);
    setShowForm(true);
  };

  const openEditForm = (event: EventItem) => {
    setEditingEventId(event.id);
    setFormData(createFormStateFromEvent(event));
    setBannerPreview(event.cover_image || null);
    setSquarePreview(event.square_image || null);
    setShowForm(true);
  };

  const processFile = (file: File, field: ImageField) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;

      if (field === "banner") {
        setBannerPreview(result);
      } else {
        setSquarePreview(result);
      }
    };

    reader.readAsDataURL(file);

    setFormData((prev) => ({
      ...prev,
      ...(field === "banner"
        ? {
            bannerFile: file,
            removeCoverImage: false,
          }
        : {
            squareFile: file,
            removeSquareImage: false,
          }),
    }));
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: ImageField,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file, field);
    }
  };

  const handleDragOver = (event: React.DragEvent, field: ImageField) => {
    event.preventDefault();
    setDraggingField(field);
  };

  const handleDragLeave = () => {
    setDraggingField(null);
  };

  const handleDrop = (event: React.DragEvent, field: ImageField) => {
    event.preventDefault();
    setDraggingField(null);

    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile, field);
    }
  };

  const handleRemoveFile = (field: ImageField) => {
    setFormData((prev) => ({
      ...prev,
      ...(field === "banner"
        ? {
            cover_image: "",
            bannerFile: null,
            removeCoverImage: Boolean(editingEventId),
          }
        : {
            square_image: "",
            squareFile: null,
            removeSquareImage: Boolean(editingEventId),
          }),
    }));

    if (field === "banner") {
      setBannerPreview(null);
    } else {
      setSquarePreview(null);
    }
  };

  const addPrompt = (
    inputKey: "experience_topic_input" | "yes_no_question_input",
    listKey: "experience_topics" | "yes_no_questions",
  ) => {
    const value = formData[inputKey].trim();
    if (!value) {
      return;
    }

    setFormData((prev) => {
      if (
        prev[listKey].some(
          (existingValue) => existingValue.toLowerCase() === value.toLowerCase(),
        )
      ) {
        return { ...prev, [inputKey]: "" };
      }

      return {
        ...prev,
        [listKey]: [...prev[listKey], value],
        [inputKey]: "",
      };
    });
  };

  const removePrompt = (
    listKey: "experience_topics" | "yes_no_questions",
    valueToRemove: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((value) => value !== valueToRemove),
    }));
  };

  const toggleAllowedYear = (year: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      allowed_study_years: checked
        ? [...prev.allowed_study_years, year]
        : prev.allowed_study_years.filter((item) => item !== year),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (formData.allowed_study_years.length === 0) {
        toast.error("Select at least one study year for this event.");
        return;
      }

      if (!editingEventId && !formData.bannerFile) {
        toast.error("Add a banner before creating the event.");
        return;
      }

      const payload = new FormData();
      payload.append("club_id", club.id);
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("location", formData.location);
      payload.append("start_date", formData.start_date);
      payload.append("end_date", formData.end_date);
      payload.append("is_public", String(formData.is_public));
      payload.append(
        "extra_data",
        JSON.stringify(
          buildEventExtraData({
            experienceTopics: formData.experience_topics,
            yesNoQuestions: formData.yes_no_questions,
            allowedStudyYears: formData.allowed_study_years,
          }),
        ),
      );

      if (editingEventId) {
        payload.append("event_id", editingEventId);
      }

      if (formData.bannerFile) {
        payload.append("cover_image_file", formData.bannerFile);
      }

      if (formData.squareFile) {
        payload.append("square_image_file", formData.squareFile);
      }

      if (formData.removeCoverImage) {
        payload.append("remove_cover_image", "true");
      }

      if (formData.removeSquareImage) {
        payload.append("remove_square_image", "true");
      }

      const res = await fetch("/api/club/event", {
        method: editingEventId ? "PATCH" : "POST",
        body: payload,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save event");
        return;
      }

      toast.success(
        editingEventId ? "Event updated successfully!" : "Event created successfully!",
      );
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      const res = await fetch(`/api/club/event?event_id=${eventId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete event");
        return;
      }
      toast.success("Event deleted successfully!");
      fetchEvents();
      if (editingEventId === eventId) {
        resetForm();
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Club Events</h3>
        <Button
          onClick={() => (showForm ? resetForm() : openCreateForm())}
          variant="outline"
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> New Event
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="animate-in slide-in-from-top-2 space-y-4 rounded-lg border bg-card p-4 shadow-sm fade-in"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold">
                {editingEventId ? "Edit event" : "Create event"}
              </h4>
              <p className="text-sm text-muted-foreground">
                Configure the banner, optional square image, study years, and
                registration questions in one place.
              </p>
            </div>
            {editingEventId && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Editing
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, title: event.target.value }))
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
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: event.target.value,
                    }))
                  }
                  placeholder="e.g. Room 304 or Zoom"
                  className="pl-9"
                />
                <MapPin className="active-icon absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Describe your event..."
              className="h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_date: event.target.value,
                    end_date: prev.end_date || event.target.value,
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
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    end_date: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <EventImageUploadField
              field="banner"
              label="Banner image"
              hint="Wide image for the event page header. PNG, JPG, or SVG."
              preview={bannerPreview}
              isDragging={draggingField === "banner"}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onChange={handleFileChange}
              onRemove={handleRemoveFile}
            />

            <EventImageUploadField
              field="square"
              label="Square image"
              hint="Optional square cover for compact cards and thumbnails."
              preview={squarePreview}
              isDragging={draggingField === "square"}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onChange={handleFileChange}
              onRemove={handleRemoveFile}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  is_public: checked === true,
                }))
              }
            />
            <Label htmlFor="is_public" className="cursor-pointer font-normal">
              Make this event public (visible to everyone)
            </Label>
          </div>

          <div className="rounded-md border border-border bg-muted/35 p-4">
            <div className="mb-3 flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Experience sliders</p>
                <p className="text-sm text-muted-foreground">
                  Add one or more topics and registrants will answer each one
                  with a percentage slider.
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                id="experience_topic"
                value={formData.experience_topic_input}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    experience_topic_input: event.target.value,
                  }))
                }
                placeholder="e.g. AutoCAD, photography, public speaking"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addPrompt("experience_topic_input", "experience_topics");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  addPrompt("experience_topic_input", "experience_topics")
                }
              >
                Add
              </Button>
            </div>

            {formData.experience_topics.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {formData.experience_topics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => removePrompt("experience_topics", topic)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm transition hover:border-destructive hover:text-destructive"
                  >
                    {topic}
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border border-border bg-muted/35 p-4">
            <div className="mb-3 flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Yes or no questions</p>
                <p className="text-sm text-muted-foreground">
                  Add reusable yes or no questions to ask during registration.
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                id="yes_no_question"
                value={formData.yes_no_question_input}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    yes_no_question_input: event.target.value,
                  }))
                }
                placeholder="e.g. Do you have your own laptop?"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addPrompt("yes_no_question_input", "yes_no_questions");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addPrompt("yes_no_question_input", "yes_no_questions")}
              >
                Add
              </Button>
            </div>

            {formData.yes_no_questions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {formData.yes_no_questions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => removePrompt("yes_no_questions", question)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm transition hover:border-destructive hover:text-destructive"
                  >
                    {question}
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-md border border-border bg-muted/35 p-4">
            <div className="mb-3 flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Allowed study years</p>
                <p className="text-sm text-muted-foreground">
                  Choose which years are allowed to register for this event.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {EVENT_STUDY_YEAR_OPTIONS.map((year) => (
                <label
                  key={year}
                  htmlFor={`allowed-year-${year}`}
                  className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm"
                >
                  <Checkbox
                    id={`allowed-year-${year}`}
                    checked={formData.allowed_study_years.includes(year)}
                    onCheckedChange={(checked) =>
                      toggleAllowedYear(year, checked === true)
                    }
                  />
                  <span>{year}</span>
                </label>
              ))}
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Existing registrations stay valid even if you later narrow the
              allowed years.
            </p>
            {formData.allowed_study_years.length === 0 && (
              <p className="mt-2 text-sm font-medium text-destructive">
                Choose at least one study year before saving the event.
              </p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingEventId ? "Saving..." : "Creating..."}
              </>
            ) : editingEventId ? (
              "Save changes"
            ) : (
              "Create event"
            )}
          </Button>
        </form>
      )}

      <div className="grid gap-4">
        {events.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
            No events scheduled. Create one above!
          </div>
        ) : (
          events.map((event) => {
            const extraData = parseEventExtraData(event.extra_data);

            return (
              <div
                key={event.id}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/30"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {event.square_image || event.cover_image ? (
                    <Image
                      src={event.square_image || event.cover_image || ""}
                      alt={event.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <Calendar className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="text-lg font-semibold">{event.title}</h4>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatEventDate(event.start_date)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    )}
                    {event.is_public === false && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.2em]">
                        Private
                      </span>
                    )}
                    {extraData.experiencePrompts?.length ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.2em]">
                        Sliders asked
                      </span>
                    ) : null}
                    {extraData.yesNoQuestions?.length ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.2em]">
                        Yes/No asked
                      </span>
                    ) : null}
                    {event.square_image ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.2em]">
                        <Square className="mr-1 inline h-3 w-3" />
                        Square image
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" type="button" onClick={() => openEditForm(event)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={getEventCheckInPath(event)}>
                      <QrCode className="mr-2 h-4 w-4" />
                      Check-ins
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => handleDelete(event.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ManageClubEvents;

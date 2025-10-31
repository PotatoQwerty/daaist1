"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import FileCard from "@/components/FileCard";
import { useSession } from "next-auth/react";
import Loading from "@/components/Loading";
import MessageCard from "@/components/MessageCard";

export default function CoursesPage() {
  const params = useParams();
  const id = params.id as string[];
  const year = id[0];
  const subject = id[1];

  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [liked, setLiked] = useState<{ id: string }[]>([]);

  // 🧠 Fetch all courses for the year
  useEffect(() => {
    // if (status !== "authenticated") return;

    const fetchCourses = async () => {
      const res = await fetch(`/api/files/level/${year}`);
      const data = await res.json();
      setCourses(data.data || []);
      setFilteredCourses(data.data || []);
    };

    fetchCourses();
  }, [status, year]);
  console.log(courses);

  // 🧠 Filter by subject (if selected)
  useEffect(() => {
    if (subject) {
      setFilteredCourses(
        courses.filter((course) => course.subject === subject)
      );
    } else {
      setFilteredCourses(courses);
    }
  }, [subject, courses]);

  // 🧠 Fetch liked files for user
  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    const fetchLikedPosts = async () => {
      const res = await fetch(`/api/files/like/user/${userId}`);
      if (!res.ok) return;
      const data = await res.json();

      setLiked(Array.isArray(data.likedFiles) ? data.likedFiles : []);
    };

    fetchLikedPosts();
  }, [status, userId]);

  // ❤️ Like/unlike handler
  const handleLike = async (fileId: string) => {
    if (!userId) return;

    const isLiked = liked.some((item) => item.id === fileId);

    // 🔹 Optimistic UI update (instant feedback)
    setLiked((prev) =>
      isLiked
        ? prev.filter((item) => item.id !== fileId)
        : [...prev, { id: fileId }]
    );

    try {
      const res = await fetch(`/api/files/like`, {
        method: "POST",
        body: JSON.stringify({ userId, fileId }),
        headers: { "Content-Type": "application/json" },
      });

      // Optionally reconcile with server if backend returns updated list
      if (res.ok) {
        const data = await res.json();
        if (data.likedposts) {
          setLiked(Array.isArray(data.likedposts) ? data.likedposts : []);
        }
      }
    } catch (err) {
      console.error("Like/unlike failed:", err);
    }
  };

  if (status === "loading") {
    return <Loading />;
  }

  return (
    <div className=" w-full h-screen flex items-center justify-center p-6 flex-col">
      <h1 className="text-2xl font-bold mb-4">Courses for {year}</h1>
      {subject && <h2 className="text-lg mb-2">Subject: {subject}</h2>}
      {/* work for pagination later */}
      <div className="w-full h-full grid justify-items-center grid-cols-1 md:grid-cols-4">
        {courses.length ? (
          courses.map((course) => (
            <FileCard
              key={course.id}
              subject={course.subject}
              size={course.size}
              title={course.file_name}
              type={course.type}
              link={course.url}
              handleLike={() => handleLike(course.id)}
              isLiked={liked.some((i) => i.id === course.id)}
            />
          ))
        ) : (
          <>
            <MessageCard
              type="error"
              message="There is nothing uploaded here"
              key="err-msg"
            />
          </>
        )}
      </div>
    </div>
  );
}

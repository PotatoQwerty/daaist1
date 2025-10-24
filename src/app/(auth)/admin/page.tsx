"use client";
import React from "react";
import MessageCard from "@/components/MessageCard";
import { RoleGate } from "@/components/RoleGate";

function AdminPage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <RoleGate AllowedRoles={["admin"]}>
        <h1>nice</h1>
      </RoleGate>
    </div>
  );
}

export default AdminPage;

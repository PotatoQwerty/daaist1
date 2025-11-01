"use client";
import React from "react";
import MessageCard from "@/components/MessageCard";
import { RoleGate } from "@/components/RoleGate";

function AdminPage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <RoleGate AllowedRoles={["admin"]}>
        <h1 className="text-2xl font-bold">Hello to the admin Page</h1>
        <p>This Page is still under construction</p>
      </RoleGate>
    </div>
  );
}

export default AdminPage;

"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManageClubMembers from "./ManageClubMembers";
import ManageClubEvents from "./ManageClubEvents";
import ManageClubSettings from "./ManageClubSettings";

function ManageClub({ club, role }: { club: any; role: string | null }) {
  const isPresident = role === "president";
  const isVicePresident = role === "vice_president";
  const isEventManager = role === "event_manager";

  const canManageMembers = isPresident || isVicePresident;
  const canManageEvents = isPresident || isVicePresident || isEventManager;

  if (!canManageMembers && !canManageEvents) return null;

  return (
    <Accordion type="multiple" className="w-full max-w-5xl">
      <AccordionItem
        value="item-1"
        className="border rounded-xl bg-card overflow-hidden shadow-sm"
      >
        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold">Club Management Dashboard</p>
              <p className="text-sm text-muted-foreground font-normal">
                Manage members, events, and settings
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6 pt-2">
          <Tabs defaultValue="members" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="mt-4">
              {canManageMembers ? (
                <ManageClubMembers club={club} />
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  You do not have permission to manage members.
                </div>
              )}
            </TabsContent>
            <TabsContent value="events" className="mt-4">
              {canManageEvents ? (
                <ManageClubEvents club={club} />
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  You do not have permission to manage events.
                </div>
              )}
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              {isPresident || isVicePresident ? (
                <ManageClubSettings club={club} />
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  You do not have permission to manage settings.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default ManageClub;

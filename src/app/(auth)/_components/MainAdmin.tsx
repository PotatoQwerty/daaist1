"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Link as LinkIcon, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INVITABLE_ROLES, roleLabel, type InvitableRole } from "@/lib/roles";

type Invite = {
  id: string;
  role_to_assign: string;
  role_label: string;
  created_at: string;
  expires_at: string;
  expired: boolean;
};

/** Turns an expiry timestamp into "in 22 hours" / "expired". */
function expiryLabel(invite: Invite) {
  if (invite.expired) return "Expired";

  const msLeft = new Date(invite.expires_at).getTime() - Date.now();
  const hours = Math.floor(msLeft / 3_600_000);

  if (hours >= 1) return `Expires in ${hours}h`;

  const minutes = Math.max(1, Math.floor(msLeft / 60_000));
  return `Expires in ${minutes}m`;
}

function MainAdmin() {
  const [inviteLink, setInviteLink] = useState("");
  const [role, setRole] = useState<InvitableRole>("admin");
  const [isCreating, setIsCreating] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/invite/manage", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setInvites(Array.isArray(data.invites) ? data.invites : []);
    } catch {
      // A failed refresh should not replace the list with an error state;
      // the existing rows stay on screen.
    } finally {
      setLoadingInvites(false);
    }
  }, []);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleCreateLink = async () => {
    setIsCreating(true);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Could not create the invite.");
        return;
      }

      setInviteLink(data.link);
      toast.success("Invite link created");
      loadInvites();
    } catch {
      toast.error("Could not create the invite.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);

    try {
      const res = await fetch("/api/admin/invite/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Could not revoke that invite.");
        return;
      }

      setInvites((prev) => prev.filter((invite) => invite.id !== id));
      toast.success("Invite revoked");
    } catch {
      toast.error("Could not revoke that invite.");
    } finally {
      setRevoking(null);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  };

  return (
    <div className="w-full space-y-12">
      <section>
        <h2 className="text-2xl font-bold">Create an invite</h2>
        <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
          Generates a single-use link that expires in 24 hours. Whoever opens it
          signs in with Google and is granted the role you pick.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2">
            <label htmlFor="role" className="text-sm font-bold">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as InvitableRole)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:border-ring focus:outline-none"
            >
              {INVITABLE_ROLES.map((invitable) => (
                <option key={invitable} value={invitable}>
                  {roleLabel(invitable)}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleCreateLink}
            disabled={isCreating}
            className="sm:mb-px"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 size-4" />
                Create link
              </>
            )}
          </Button>
        </div>

        {/* Shown once. Only the hash is stored, so this link cannot be
            recovered from the list below. */}
        {inviteLink && (
          <div className="mt-6 rounded-lg border border-border bg-card p-4">
            <p className="annot">Copy this now</p>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 rounded-md bg-subtle p-3 font-mono text-xs break-all">
                {inviteLink}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                title="Copy invite link"
                aria-label="Copy invite link"
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              The link is shown once and cannot be retrieved later. You can
              revoke it below.
            </p>
          </div>
        )}
      </section>

      <section className="rule-t pt-10">
        <h2 className="text-2xl font-bold">Pending invites</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Links that have been created but not used yet.
        </p>

        {loadingInvites ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading
          </p>
        ) : invites.length === 0 ? (
          <p className="mt-6 border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            No pending invites. Create one above.
          </p>
        ) : (
          <ul className="mt-6">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="rule-t flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div className="min-w-0">
                  <p className="font-bold">
                    {invite.role_label ?? roleLabel(invite.role_to_assign)}
                  </p>
                  <p className="annot mt-1">
                    {new Date(invite.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`annot ${invite.expired ? "text-destructive" : ""}`}
                  >
                    {expiryLabel(invite)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(invite.id)}
                    disabled={revoking === invite.id}
                    aria-label={`Revoke ${invite.role_label} invite`}
                  >
                    {revoking === invite.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Revoke
                  </Button>
                </div>
              </li>
            ))}
            <li className="rule-t" />
          </ul>
        )}
      </section>
    </div>
  );
}

export default MainAdmin;

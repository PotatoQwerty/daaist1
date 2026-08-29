import { useUser } from "@/context/user-context";
import { canAdminister, canUploadResources } from "@/lib/roles";

/**
 * Client-side view of what the signed-in account may do.
 *
 * Capabilities are derived from `roles` through the helpers in lib/roles, so
 * a component never hand-rolls a role comparison and the answer matches what
 * the API routes enforce.
 */
export const useCurrentRole = () => {
  const { roles, isAdmin, loading, isSuperAdmin } = useUser();

  return {
    roles,
    loading,
    isAdmin,
    isSuperAdmin,
    isTeacher: roles.includes("teacher"),
    /** Site administration: users, clubs, invites, admin dashboard. */
    canAdminister: canAdminister(roles),
    /** Publish course material. Teachers have this; they are not admins. */
    canUpload: canUploadResources(roles),
  };
};

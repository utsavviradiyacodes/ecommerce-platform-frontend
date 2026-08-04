import { useState } from "react";

function EditIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className="fill-current"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
      />
    </svg>
  );
}

function ProfileAvatar({ avatarUrl, adminName, adminInitial }) {
  const [hasAvatarError, setHasAvatarError] = useState(false);

  return (
    <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-brand-500 text-2xl font-semibold text-white dark:border-gray-800">
      {avatarUrl && !hasAvatarError ? (
        <img
          src={avatarUrl}
          alt={`${adminName} profile`}
          onError={() => setHasAvatarError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        adminInitial
      )}
    </div>
  );
}

function ProfileSummaryCard({
  admin = null,
  isRefreshing = false,
  isEditDisabled = false,
  onEdit = () => {},
}) {
  const adminName =
    typeof admin?.name === "string" && admin.name.trim()
      ? admin.name.trim()
      : "Administrator";

  const adminEmail = typeof admin?.email === "string" ? admin.email.trim() : "";

  const avatarUrl =
    typeof admin?.avatar === "string" ? admin.avatar.trim() : "";

  const adminInitial = adminName.charAt(0).toUpperCase();

  const administratorType =
    admin?.isSuperAdmin === true ? "Super administrator" : "Administrator";

  return (
    <div className="rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col items-center gap-6 xl:flex-row">
          <ProfileAvatar
            key={avatarUrl || "profile-avatar-fallback"}
            avatarUrl={avatarUrl}
            adminName={adminName}
            adminInitial={adminInitial}
          />

          <div className="min-w-0 text-center xl:text-left">
            <div className="flex flex-col items-center gap-2 xl:flex-row">
              <h2 className="min-w-0 wrap-break-word text-lg font-semibold text-gray-800 dark:text-white/90">
                {adminName}
              </h2>

              {isRefreshing && (
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  Refreshing
                </span>
              )}
            </div>

            <div className="mt-1 flex min-w-0 flex-col items-center gap-1 text-sm text-gray-500 xl:flex-row xl:gap-3 xl:text-left dark:text-gray-400">
              <span>{administratorType}</span>

              {adminEmail && (
                <>
                  <span className="hidden h-3.5 w-px bg-gray-300 xl:block dark:bg-gray-700" />

                  <span className="min-w-0 break-all">{adminEmail}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          disabled={isEditDisabled}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 xl:inline-flex xl:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200"
        >
          <EditIcon />
          Edit profile
        </button>
      </div>
    </div>
  );
}

export default ProfileSummaryCard;

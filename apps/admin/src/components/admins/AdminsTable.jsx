import { useState } from "react";

import { ADMIN_PERMISSIONS } from "../../constants/adminPermissions.js";
import Pagination from "../ui/pagination/Pagination.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table/Table.jsx";

const EMPTY_VALUE = "\u2014";
const SKELETON_ROW_COUNT = 10;

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const PERMISSION_LABELS = {
  manageProducts: "Products",
  manageSellers: "Sellers",
  manageOrders: "Orders",
  manageCustomers: "Customers",
};
const SUPPORTED_PERMISSION_KEYS = Object.values(ADMIN_PERMISSIONS);

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getAdminId(admin) {
  return normalizeText(admin?._id ?? admin?.id);
}

function isValidAdminId(value) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

function formatDate(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return EMPTY_VALUE;
  }

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : dateFormatter.format(date);
}

function getEnabledPermissions(admin) {
  const permissions =
    admin?.permissions && typeof admin.permissions === "object"
      ? admin.permissions
      : {};

  return Object.entries(permissions)
    .filter(([, value]) => value === true)
    .map(([key]) => ({ key, label: PERMISSION_LABELS[key] || key }));
}

function AdminAvatar({ admin }) {
  const source = normalizeText(admin?.avatar);
  const name = normalizeText(admin?.name);
  const [failedSource, setFailedSource] = useState("");
  const hasError = Boolean(source && failedSource === source);

  if (!source || hasError) {
    return (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
        {(name.charAt(0) || "A").toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={name ? `${name} avatar` : "Admin avatar"}
      className="size-11 shrink-0 rounded-full border border-gray-200 object-cover dark:border-gray-700"
      onError={() => setFailedSource(source)}
    />
  );
}

function AdminRoleBadge({ isSuperAdmin }) {
  return isSuperAdmin ? (
    <span className="inline-flex items-center rounded-full bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">
      Super Admin
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
      Admin
    </span>
  );
}

function AccountBadge({ value, trueLabel, falseLabel }) {
  if (value !== true && value !== false) {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        Unknown
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        value
          ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
          : "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
      }`}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path d="M2.75 12C4.55 7.95 7.58 5.75 12 5.75C16.42 5.75 19.45 7.95 21.25 12C19.45 16.05 16.42 18.25 12 18.25C7.58 18.25 4.55 16.05 2.75 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path d="M13.5 6.5L17.5 10.5M5 19L8.75 18.25L19 8C19.83 7.17 19.83 5.83 19 5C18.17 4.17 16.83 4.17 16 5L5.75 15.25L5 19Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PermissionsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path d="M12 3L19 6V11C19 15.35 16.22 19.2 12 21C7.78 19.2 5 15.35 5 11V6L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 12L11 14L15.5 9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path d="M5 7H19M9 7V4.5H15V7M7.5 7L8.25 20H15.75L16.5 7M10 10.5V16.5M14 10.5V16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AdminsTableSkeleton() {
  return Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
    <TableRow key={index}>
      {Array.from({ length: 6 }, (_, cellIndex) => (
        <TableCell key={cellIndex} className="px-4 py-4 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6">
          <div className={`h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-800 ${cellIndex === 5 ? "ml-auto w-28" : "w-24"}`} />
          {cellIndex === 0 && <div className="mt-2 h-3 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />}
        </TableCell>
      ))}
    </TableRow>
  ));
}

function AdminsTable({
  admins = [],
  currentAdminId = "",
  isLoading = false,
  hasSearch = false,
  currentPage = 1,
  totalPages = 0,
  totalItems = 0,
  pageSize = 10,
  updateTargetId = "",
  permissionsTargetId = "",
  deleteTargetId = "",
  isUpdatePending = false,
  isPermissionsPending = false,
  isDeletePending = false,
  onPageChange = () => {},
  onView = () => {},
  onEdit = () => {},
  onPermissions = () => {},
  onDelete = () => {},
}) {
  const hasRows = admins.length > 0;

  return (
    <div className="w-full min-w-0 max-w-full rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      {(isLoading || hasRows) && (
        <div className="custom-scrollbar max-w-full overflow-x-auto">
          <Table className="min-w-[1120px]">
            <TableHeader className="border-b border-gray-100 dark:border-white/5">
              <TableRow>
                {["Admin", "Role", "Permissions", "Account", "Created", "Actions"].map((heading, index) => (
                  <TableCell
                    key={heading}
                    isHeader
                    className={`px-4 py-3 font-medium whitespace-nowrap text-gray-500 text-theme-xs dark:text-gray-400 ${index === 0 ? "pl-5 text-start sm:pl-6" : ""} ${index === 5 ? "pr-5 text-right sm:pr-6" : "text-start"}`}
                  >
                    {heading}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading && <AdminsTableSkeleton />}
              {!isLoading && admins.map((admin, index) => {
                const adminId = getAdminId(admin);
                const isCurrentAdmin = Boolean(adminId && adminId === currentAdminId);
                const hasValidId = isValidAdminId(adminId);
                const enabledPermissions = getEnabledPermissions(admin);
                const hasFullAccess =
                  admin?.isSuperAdmin === true ||
                  (SUPPORTED_PERMISSION_KEYS.length > 0 &&
                    SUPPORTED_PERMISSION_KEYS.every(
                      (permissionKey) =>
                        admin?.permissions?.[permissionKey] === true
                    ));
                const isThisUpdatePending = isUpdatePending && updateTargetId === adminId;
                const isThisPermissionsPending = isPermissionsPending && permissionsTargetId === adminId;
                const isThisDeletePending = isDeletePending && deleteTargetId === adminId;
                const hasConflictingMutation = isThisUpdatePending || isThisPermissionsPending || isThisDeletePending;

                return (
                  <TableRow key={adminId || `admin-row-${index}`} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/2">
                    <TableCell className="min-w-72 max-w-88 px-4 py-4 pl-5 sm:pl-6">
                      <div className="flex min-w-0 items-center gap-3">
                        <AdminAvatar admin={admin} />
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90" title={admin?.name || undefined}>
                              {normalizeText(admin?.name) || "Admin name unavailable"}
                            </p>
                            {isCurrentAdmin && (
                              <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                                You
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400" title={admin?.email || undefined}>
                            {normalizeText(admin?.email) || "Email unavailable"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                            {normalizeText(admin?.phone) || "Phone unavailable"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="min-w-32 px-4 py-4">
                      <AdminRoleBadge isSuperAdmin={admin?.isSuperAdmin === true} />
                    </TableCell>

                    <TableCell className="min-w-64 max-w-80 px-4 py-4">
                      {hasFullAccess ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400">Full access</p>
                      ) : enabledPermissions.length > 0 ? (
                        <div className="flex max-w-72 flex-wrap gap-1.5">
                          {enabledPermissions.slice(0, 3).map((permission) => (
                            <span key={permission.key} className="max-w-full truncate rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400" title={permission.label}>
                              {permission.label}
                            </span>
                          ))}
                          {enabledPermissions.length > 3 && (
                            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              +{enabledPermissions.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No enabled permissions</p>
                      )}
                    </TableCell>

                    <TableCell className="min-w-48 px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <AccountBadge value={admin?.isActive} trueLabel="Active" falseLabel="Inactive" />
                        <AccountBadge value={admin?.isVerified} trueLabel="Verified" falseLabel="Pending verification" />
                      </div>
                    </TableCell>

                    <TableCell className="min-w-32 px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(admin?.createdAt)}
                    </TableCell>

                    <TableCell className="px-4 py-4 pr-5 text-right sm:pr-6">
                      <div className="flex justify-end gap-2">
                        <button type="button" title="View Admin details" onClick={() => onView(admin)} className="relative inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-theme-xs transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                          <span className="sr-only">View Admin details</span>
                          <ViewIcon />
                        </button>
                        {hasValidId && (
                          <button type="button" title="Edit Admin" onClick={() => onEdit(admin)} disabled={hasConflictingMutation} className="relative inline-flex size-9 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-700 shadow-theme-xs transition hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/15">
                            <span className="sr-only">Edit Admin</span>
                            <EditIcon />
                          </button>
                        )}
                        {hasValidId && !admin?.isSuperAdmin && (
                          <button type="button" title="Manage Admin permissions" onClick={() => onPermissions(admin)} disabled={hasConflictingMutation} className="relative inline-flex size-9 items-center justify-center rounded-lg border border-warning-200 bg-warning-50 text-warning-700 shadow-theme-xs transition hover:bg-warning-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400 dark:hover:bg-warning-500/15">
                            <span className="sr-only">Manage Admin permissions</span>
                            <PermissionsIcon />
                          </button>
                        )}
                        {hasValidId && !isCurrentAdmin && (
                          <button type="button" title="Delete Admin" onClick={() => onDelete(admin)} disabled={hasConflictingMutation} className="relative inline-flex size-9 items-center justify-center rounded-lg border border-error-200 bg-error-50 text-error-700 shadow-theme-xs transition hover:bg-error-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/15">
                            <span className="sr-only">Delete Admin</span>
                            <DeleteIcon />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !hasRows && (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {hasSearch ? "No Admins match the selected filters." : "No Admins found."}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {hasSearch ? "Try another Admin name or email." : "Admin accounts returned by the backend will appear here."}
          </p>
        </div>
      )}

      {!isLoading && totalItems > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={onPageChange} />
      )}
    </div>
  );
}

export { AdminRoleBadge, PERMISSION_LABELS };
export default AdminsTable;

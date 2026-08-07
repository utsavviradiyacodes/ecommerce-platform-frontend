import { useId } from "react";

import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";
import { AdminRoleBadge, PERMISSION_LABELS } from "./AdminsTable.jsx";

const EMPTY_VALUE = "\u2014";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return EMPTY_VALUE;
  }

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime())
    ? EMPTY_VALUE
    : dateFormatter.format(date);
}

function formatBoolean(value, trueLabel, falseLabel) {
  return value === true
    ? trueLabel
    : value === false
      ? falseLabel
      : EMPTY_VALUE;
}

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 wrap-break-word text-sm text-gray-800 dark:text-white/90">
        {value || EMPTY_VALUE}
      </dd>
    </div>
  );
}

function AdminDetailsModal({
  isOpen,
  admin = null,
  isCurrentAdmin = false,
  onClose = () => {},
}) {
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  const permissions =
    admin?.permissions && typeof admin.permissions === "object"
      ? Object.entries(admin.permissions).filter(
          ([, value]) => typeof value === "boolean"
        )
      : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[92vh] max-w-3xl overflow-hidden"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <div className="flex max-h-[92vh] min-w-0 flex-col">
        <div className="shrink-0 border-b border-gray-100 px-5 pt-7 pb-5 pr-16 sm:px-8 sm:pt-8 sm:pr-20 dark:border-gray-800">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h3
              id={titleId}
              className="wrap-break-word text-xl font-semibold text-gray-800 dark:text-white/90"
            >
              {normalizeText(admin?.name) || "Admin details"}
            </h3>
            <AdminRoleBadge isSuperAdmin={admin?.isSuperAdmin === true} />
            {isCurrentAdmin && (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                You
              </span>
            )}
          </div>
          <p
            id={descriptionId}
            className="mt-1.5 text-sm leading-6 text-gray-500 dark:text-gray-400"
          >
            Safe fields from the direct Admin list record. No separate details
            request is available.
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          <section className="rounded-xl border border-gray-200 p-4 sm:p-5 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Account
            </h4>
            <dl className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Admin ID" value={normalizeText(admin?._id)} />
              <DetailItem label="Name" value={normalizeText(admin?.name)} />
              <DetailItem label="Email" value={normalizeText(admin?.email)} />
              <DetailItem label="Phone" value={normalizeText(admin?.phone)} />
              <DetailItem
                label="Role"
                value={
                  admin?.isSuperAdmin
                    ? "Super Admin"
                    : normalizeText(admin?.role) || "Admin"
                }
              />
              <DetailItem
                label="Account status"
                value={formatBoolean(admin?.isActive, "Active", "Inactive")}
              />
              <DetailItem
                label="Verification"
                value={formatBoolean(
                  admin?.isVerified,
                  "Verified",
                  "Pending verification"
                )}
              />
              <DetailItem
                label="Created"
                value={formatDate(admin?.createdAt)}
              />
              <DetailItem
                label="Updated"
                value={formatDate(admin?.updatedAt)}
              />
            </dl>
          </section>

          <section className="mt-4 rounded-xl border border-gray-200 p-4 sm:p-5 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Permissions
            </h4>
            {admin?.isSuperAdmin ? (
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                Super Admins bypass granular frontend permission checks and have
                full dashboard access.
              </p>
            ) : permissions.length > 0 ? (
              <ul className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                {permissions.map(([key, enabled]) => (
                  <li
                    key={key}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-white/2"
                  >
                    <span className="min-w-0 wrap-break-word text-sm text-gray-700 dark:text-gray-300">
                      {PERMISSION_LABELS[key] || key}
                    </span>
                    <span
                      className={`shrink-0 text-xs font-medium ${enabled ? "text-success-600 dark:text-success-400" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {enabled ? "Enabled" : "Disabled"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                No permission values were returned.
              </p>
            )}
          </section>
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-100 px-5 py-4 sm:px-8 sm:py-5 dark:border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AdminDetailsModal;

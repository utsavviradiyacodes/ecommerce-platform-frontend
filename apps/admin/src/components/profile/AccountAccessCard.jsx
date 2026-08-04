const PERMISSION_LABELS = [
  {
    key: "manageProducts",
    label: "Products",
  },
  {
    key: "manageSellers",
    label: "Sellers",
  },
  {
    key: "manageOrders",
    label: "Orders",
  },
  {
    key: "manageCustomers",
    label: "Customers",
  },
];

function formatMemberSince(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ isPositive, positiveLabel, negativeLabel }) {
  const label =
    isPositive === true
      ? positiveLabel
      : isPositive === false
        ? negativeLabel
        : "Not available";

  const badgeClassName =
    isPositive === true
      ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
      : isPositive === false
        ? "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400"
        : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClassName}`}
    >
      {label}
    </span>
  );
}

function AccountInformationItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
        {label}
      </dt>

      <dd className="text-sm font-medium text-gray-800 dark:text-white/90">
        {children}
      </dd>
    </div>
  );
}

function AccountAccessCard({ admin = null }) {
  const enabledPermissions = PERMISSION_LABELS.filter(
    ({ key }) => admin?.permissions?.[key] === true
  );

  return (
    <section className="rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Account access
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your account status and administrative access.
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
        <AccountInformationItem label="Account status">
          <StatusBadge
            isPositive={admin?.isActive}
            positiveLabel="Active"
            negativeLabel="Inactive"
          />
        </AccountInformationItem>

        <AccountInformationItem label="Email verification">
          <StatusBadge
            isPositive={admin?.isVerified}
            positiveLabel="Verified"
            negativeLabel="Unverified"
          />
        </AccountInformationItem>

        <AccountInformationItem label="Member since">
          {formatMemberSince(admin?.createdAt)}
        </AccountInformationItem>
      </dl>

      <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Administrative permissions
        </h3>

        {admin?.isSuperAdmin === true ? (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Full administrative access
          </p>
        ) : enabledPermissions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {enabledPermissions.map(({ key, label }) => (
              <span
                key={key}
                className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
              >
                {label}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            No administrative permissions assigned
          </p>
        )}
      </div>
    </section>
  );
}

export default AccountAccessCard;

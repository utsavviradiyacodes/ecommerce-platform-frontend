function InformationItem({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
        {label}
      </dt>

      <dd className="wrap-break-word text-sm font-medium text-gray-800 dark:text-white/90">
        {value}
      </dd>
    </div>
  );
}

function PersonalInformationCard({ admin = null }) {
  const adminName =
    typeof admin?.name === "string" && admin.name.trim()
      ? admin.name.trim()
      : "Not available";

  const adminEmail =
    typeof admin?.email === "string" && admin.email.trim()
      ? admin.email.trim()
      : "Not available";

  const adminPhone =
    typeof admin?.phone === "string" && admin.phone.trim()
      ? admin.phone.trim()
      : "Not provided";

  const administratorType =
    admin?.isSuperAdmin === true ? "Super administrator" : "Administrator";

  return (
    <section className="rounded-2xl border border-gray-200 p-5 lg:p-6 dark:border-gray-800">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Personal information
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your basic administrator account details.
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
        <InformationItem label="Full name" value={adminName} />

        <InformationItem label="Email address" value={adminEmail} />

        <InformationItem label="Phone number" value={adminPhone} />

        <InformationItem label="Administrator type" value={administratorType} />
      </dl>
    </section>
  );
}

export default PersonalInformationCard;

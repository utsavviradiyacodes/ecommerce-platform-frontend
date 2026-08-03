import DashboardMetricCard from "./DashboardMetricCard.jsx";

const integerFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getNonNegativeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function formatCount(value) {
  const number = getNonNegativeNumber(value);

  return number === null ? "—" : integerFormatter.format(number);
}

function formatCurrency(value) {
  const number = getNonNegativeNumber(value);

  return number === null ? "—" : currencyFormatter.format(number);
}

function CustomersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
      <path
        d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3 21V19C3 15.6863 5.68629 13 9 13C12.3137 13 15 15.6863 15 19V21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M16 4.1C17.7207 4.54633 19 6.11085 19 8C19 9.88915 17.7207 11.4537 16 11.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M17 14C19.2091 14 21 15.7909 21 18V21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
      <path
        d="M4 7.5L12 3L20 7.5L12 12L4 7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M4 7.5V16.5L12 21L20 16.5V7.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 12V21" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
      <path
        d="M6 3H18L20 21H4L6 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 8C9 9.65685 10.3431 11 12 11C13.6569 11 15 9.65685 15 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8.5 7.5H15.5M8.5 10.5H15.5M10 7.5C10 11.5 12 13 15.5 13M10 13L15.5 17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EcommerceMetrics({ stats = null, isLoading = false }) {
  const totalCustomers = stats?.users?.totalCustomers;
  const totalProducts = stats?.products?.total;
  const activeProducts = stats?.products?.active;
  const totalOrders = stats?.orders?.total;
  const deliveredOrders = stats?.orders?.delivered;
  const totalRevenue = stats?.totalRevenue;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:gap-6">
      <DashboardMetricCard
        title="Customers"
        value={formatCount(totalCustomers)}
        helperText="All time"
        icon={<CustomersIcon />}
        isLoading={isLoading}
      />

      <DashboardMetricCard
        title="Products"
        value={formatCount(totalProducts)}
        helperText={`${formatCount(activeProducts)} active`}
        helperTone="success"
        icon={<ProductsIcon />}
        isLoading={isLoading}
      />

      <DashboardMetricCard
        title="Orders"
        value={formatCount(totalOrders)}
        helperText={`${formatCount(deliveredOrders)} delivered`}
        helperTone="success"
        icon={<OrdersIcon />}
        isLoading={isLoading}
      />

      <DashboardMetricCard
        title="Revenue"
        value={formatCurrency(totalRevenue)}
        helperText="Paid orders"
        helperTone="success"
        icon={<RevenueIcon />}
        isLoading={isLoading}
      />
    </div>
  );
}

export default EcommerceMetrics;

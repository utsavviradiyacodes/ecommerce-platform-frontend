import Select from "../form/Select.jsx";

const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All order statuses" },
  { value: "placed", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All payment statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All payment methods" },
  { value: "online", label: "Online" },
  { value: "upi", label: "UPI" },
];

function getSafeCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function OrdersToolbar({
  orderStatus = "",
  paymentStatus = "",
  paymentMethod = "",
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  pageRecordCount = 0,
  disabled = false,
  onOrderStatusChange = () => {},
  onPaymentStatusChange = () => {},
  onPaymentMethodChange = () => {},
}) {
  const safeCurrentPage = Math.max(getSafeCount(currentPage), 1);
  const safePageSize = Math.max(getSafeCount(pageSize), 1);
  const safeTotalItems = getSafeCount(totalItems);
  const safePageRecordCount = getSafeCount(pageRecordCount);
  const hasActiveFilters = Boolean(
    orderStatus || paymentStatus || paymentMethod
  );
  const firstVisibleItem =
    safeTotalItems > 0 && safePageRecordCount > 0
      ? (safeCurrentPage - 1) * safePageSize + 1
      : 0;
  const lastVisibleItem =
    firstVisibleItem > 0
      ? Math.min(
          firstVisibleItem + safePageRecordCount - 1,
          safeTotalItems
        )
      : 0;

  return (
    <div className="mb-5 min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-white/5 dark:bg-white/3">
      <div className="mb-3 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {disabled ? (
            <>Loading Orders…</>
          ) : firstVisibleItem > 0 ? (
            <>
              Showing {firstVisibleItem.toLocaleString("en-IN")}–
              {lastVisibleItem.toLocaleString("en-IN")} of{" "}
              {safeTotalItems.toLocaleString("en-IN")} Orders
            </>
          ) : hasActiveFilters ? (
            <>No Orders match the selected filters</>
          ) : (
            <>No Orders found</>
          )}
        </p>
        {hasActiveFilters && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Server filters active
          </p>
        )}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
        <div className="relative min-w-0">
          <label htmlFor="order-status-filter" className="sr-only">
            Filter Orders by Order status
          </label>
          <Select
            id="order-status-filter"
            name="orderStatusFilter"
            value={orderStatus}
            options={ORDER_STATUS_OPTIONS}
            placeholder=""
            disabled={disabled}
            onChange={onOrderStatusChange}
          />
        </div>

        <div className="relative min-w-0">
          <label htmlFor="order-payment-status-filter" className="sr-only">
            Filter Orders by payment status
          </label>
          <Select
            id="order-payment-status-filter"
            name="orderPaymentStatusFilter"
            value={paymentStatus}
            options={PAYMENT_STATUS_OPTIONS}
            placeholder=""
            disabled={disabled}
            onChange={onPaymentStatusChange}
          />
        </div>

        <div className="relative min-w-0">
          <label htmlFor="order-payment-method-filter" className="sr-only">
            Filter Orders by payment method
          </label>
          <Select
            id="order-payment-method-filter"
            name="orderPaymentMethodFilter"
            value={paymentMethod}
            options={PAYMENT_METHOD_OPTIONS}
            placeholder=""
            disabled={disabled}
            onChange={onPaymentMethodChange}
          />
        </div>
      </div>
    </div>
  );
}

export default OrdersToolbar;

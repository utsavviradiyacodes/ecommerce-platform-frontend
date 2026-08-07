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

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const ORDER_STATUS_TONES = {
  placed: "warning",
  confirmed: "brand",
  processing: "brand",
  shipped: "brand",
  delivered: "success",
  cancelled: "error",
};

const PAYMENT_STATUS_TONES = {
  pending: "warning",
  paid: "success",
  failed: "error",
  refunded: "neutral",
};

const BADGE_CLASSES = {
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  success:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  warning:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  error: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getEntityId(entity) {
  if (typeof entity === "number" && Number.isFinite(entity)) {
    return String(entity);
  }

  if (typeof entity === "string") {
    return normalizeText(entity);
  }

  return normalizeText(entity?._id ?? entity?.id);
}

function getOrderId(order) {
  return getEntityId(order);
}

function formatOrderReference(order) {
  const orderId = getOrderId(order);

  return orderId
    ? `#${orderId.slice(-8).toUpperCase()}`
    : "Order ID unavailable";
}

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

function formatCurrency(value) {
  const number = getNonNegativeNumber(value);

  return number === null ? EMPTY_VALUE : currencyFormatter.format(number);
}

function formatDateTime(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return EMPTY_VALUE;
  }

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime())
    ? EMPTY_VALUE
    : dateTimeFormatter.format(date);
}

function formatLabel(value) {
  const normalizedValue = normalizeText(value).toLowerCase();

  if (!normalizedValue) {
    return "Unknown";
  }

  return normalizedValue
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPaymentMethod(value) {
  const normalizedValue = normalizeText(value).toLowerCase();

  if (normalizedValue === "upi") {
    return "UPI";
  }

  return formatLabel(normalizedValue);
}

function getCustomer(order) {
  const customer = order?.customer;

  return customer && typeof customer === "object" && !Array.isArray(customer)
    ? customer
    : null;
}

function getSellerLabels(order) {
  const orderItems = Array.isArray(order?.orderItems) ? order.orderItems : [];
  const labelsByKey = new Map();

  orderItems.forEach((item, index) => {
    const seller = item?.seller;
    const sellerId = getEntityId(seller);
    const label =
      normalizeText(seller?.shopName) ||
      normalizeText(seller?.name) ||
      (sellerId
        ? `Seller #${sellerId.slice(-8).toUpperCase()}`
        : "Seller unavailable");
    const key = sellerId || `${label}-${index}`;

    labelsByKey.set(key, label);
  });

  return Array.from(labelsByKey.values());
}

function StatusBadge({ value, toneMap }) {
  const normalizedValue = normalizeText(value).toLowerCase();
  const tone = toneMap[normalizedValue] ?? "neutral";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_CLASSES[tone]}`}
    >
      {formatLabel(normalizedValue)}
    </span>
  );
}

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path
        d="M2.75 12C4.55 7.95 7.58 5.75 12 5.75C16.42 5.75 19.45 7.95 21.25 12C19.45 16.05 16.42 18.25 12 18.25C7.58 18.25 4.55 16.05 2.75 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="2.75"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function OrdersTableSkeleton() {
  return Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
    <TableRow key={index}>
      <TableCell className="px-5 py-4 sm:px-6">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-2 h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-2 h-3 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="min-w-52 px-4 py-4">
        <div className="h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-5 py-4 text-right sm:px-6">
        <div className="ml-auto h-9 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      </TableCell>
    </TableRow>
  ));
}

function OrdersTable({
  orders = [],
  isLoading = false,
  hasActiveFilters = false,
  currentPage = 1,
  totalPages = 0,
  totalItems = 0,
  pageSize = 10,
  onPageChange = () => {},
  onView = () => {},
}) {
  const hasOrders = orders.length > 0;

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      {(isLoading || hasOrders) && (
        <div className="custom-scrollbar max-w-full overflow-x-auto overflow-y-hidden">
          <Table className="min-w-305">
            <TableHeader className="border-b border-gray-100 dark:border-white/5">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start font-medium text-gray-500 text-theme-xs sm:px-6 dark:text-gray-400"
                >
                  Order
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Customer
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Sellers
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Order status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-center font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Payment
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Order total
                </TableCell>
                <TableCell
                  isHeader
                  className="min-w-52 px-4 py-3 text-start font-medium whitespace-nowrap text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Placed
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-right font-medium text-gray-500 text-theme-xs sm:px-6 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading && <OrdersTableSkeleton />}
              {!isLoading &&
                orders.map((order, index) => {
                  const orderId = getOrderId(order);
                  const customer = getCustomer(order);
                  const customerName =
                    normalizeText(customer?.name) || "Customer unavailable";
                  const customerEmail =
                    normalizeText(customer?.email) || "Email unavailable";
                  const sellerLabels = getSellerLabels(order);
                  const firstSeller = sellerLabels[0] || "Seller unavailable";
                  const additionalSellerCount = Math.max(
                    sellerLabels.length - 1,
                    0
                  );
                  const itemCount = Array.isArray(order?.orderItems)
                    ? order.orderItems.length
                    : null;
                  const orderKey =
                    orderId || `${formatOrderReference(order)}-${index}`;

                  return (
                    <TableRow
                      key={orderKey}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-white/2"
                    >
                      <TableCell className="px-5 py-4 sm:px-6">
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {formatOrderReference(order)}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {itemCount === null
                            ? "Items unavailable"
                            : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-56 max-w-72 px-4 py-4">
                        <p
                          title={customerName}
                          className="truncate text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          {customerName}
                        </p>
                        <p
                          title={customerEmail}
                          className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
                        >
                          {customerEmail}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-48 max-w-64 px-4 py-4">
                        <p
                          title={sellerLabels.join(", ")}
                          className="truncate text-sm text-gray-700 dark:text-gray-300"
                        >
                          {firstSeller}
                          {additionalSellerCount > 0
                            ? ` +${additionalSellerCount}`
                            : ""}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-32 px-4 py-4">
                        <StatusBadge
                          value={order?.orderStatus}
                          toneMap={ORDER_STATUS_TONES}
                        />
                      </TableCell>
                      <TableCell className="min-w-36 px-4 py-4">
                        <div className="flex flex-col items-center text-center">
                          <StatusBadge
                            value={order?.paymentStatus}
                            toneMap={PAYMENT_STATUS_TONES}
                          />
                          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            {formatPaymentMethod(order?.paymentMethod)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-32 px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                        {formatCurrency(order?.totalPrice)}
                      </TableCell>
                      <TableCell className="min-w-52 px-4 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {formatDateTime(order?.createdAt)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right sm:px-6">
                        <button
                          type="button"
                          disabled={!orderId}
                          onClick={() => onView(order)}
                          className="ml-auto inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <ViewIcon />
                          View
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !hasOrders && (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto max-w-sm">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {hasActiveFilters
                ? "No Orders match the selected filters"
                : "No Orders found"}
            </p>
            {hasActiveFilters && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try changing one or more Order filters.
              </p>
            )}
          </div>
        </div>
      )}

      {!isLoading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

export default OrdersTable;

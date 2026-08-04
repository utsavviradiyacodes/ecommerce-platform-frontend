import { useEffect, useId, useRef } from "react";

import Button from "../ui/button/Button.jsx";

const EMPTY_VALUE = "\u2014";
const FOCUSABLE_ELEMENT_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN", {
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
  brand:
    "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  success:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  warning:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  error:
    "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
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

function formatOrderReference(order) {
  const orderId = getEntityId(order);

  return orderId ? `#${orderId.slice(-8).toUpperCase()}` : "Order ID unavailable";
}

function getNumber(value, { integer = false } = {}) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return integer && !Number.isInteger(number) ? null : number;
}

function formatCurrency(value) {
  const number = getNumber(value);

  return number === null ? EMPTY_VALUE : currencyFormatter.format(number);
}

function formatNumber(value) {
  const number = getNumber(value, { integer: true });

  return number === null ? EMPTY_VALUE : numberFormatter.format(number);
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

  if (normalizedValue === "upi") {
    return "UPI";
  }

  return normalizedValue
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-gray-800 dark:text-white/90">
        {value || EMPTY_VALUE}
      </dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 p-4 sm:p-5 dark:border-gray-800">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h4>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FinancialRow({ label, value, emphasized = false }) {
  return (
    <div
      className={`flex min-w-0 items-center justify-between gap-4 py-2 text-sm ${
        emphasized
          ? "border-t border-gray-200 pt-3 font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90"
          : "text-gray-600 dark:text-gray-400"
      }`}
    >
      <span>{label}</span>
      <span className="shrink-0">{formatCurrency(value)}</span>
    </div>
  );
}

function getSellerLabel(item) {
  const seller = normalizeObject(item?.seller);

  return (
    normalizeText(seller?.shopName) ||
    normalizeText(seller?.name) ||
    "Seller unavailable"
  );
}

function getItemName(item) {
  const product = normalizeObject(item?.product);

  return (
    normalizeText(item?.name) ||
    normalizeText(product?.name) ||
    "Product unavailable"
  );
}

function OrderItem({ item }) {
  const quantity = getNumber(item?.quantity, { integer: true });
  const price = getNumber(item?.price);
  const lineTotal =
    quantity !== null && price !== null ? quantity * price : null;

  return (
    <li className="flex min-w-0 flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="break-words text-sm font-medium text-gray-800 dark:text-white/90">
          {getItemName(item)}
        </p>
        <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">
          {getSellerLabel(item)}
        </p>
      </div>
      <div className="shrink-0 text-left sm:text-right">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {quantity === null ? EMPTY_VALUE : formatNumber(quantity)} × {formatCurrency(price)}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {lineTotal === null ? EMPTY_VALUE : formatCurrency(lineTotal)}
        </p>
      </div>
    </li>
  );
}

function DetailsSkeleton() {
  return (
    <div className="animate-pulse space-y-4 px-5 py-6 sm:px-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-36 rounded-xl bg-gray-200 dark:bg-gray-800" />
      ))}
    </div>
  );
}

function OrderDetailsContent({ order }) {
  const customer = normalizeObject(order?.customer);
  const address = normalizeObject(order?.shippingAddress);
  const orderItems = Array.isArray(order?.orderItems) ? order.orderItems : [];
  const addressLines = [
    normalizeText(address?.addressLine1),
    normalizeText(address?.addressLine2),
    [normalizeText(address?.city), normalizeText(address?.state)]
      .filter(Boolean)
      .join(", "),
    [normalizeText(address?.pincode), normalizeText(address?.country)]
      .filter(Boolean)
      .join(" "),
  ].filter(Boolean);

  return (
    <div className="space-y-4 px-5 py-6 sm:px-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/2">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Order status
          </p>
          <div className="mt-2">
            <StatusBadge value={order?.orderStatus} toneMap={ORDER_STATUS_TONES} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/2">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Payment status
          </p>
          <div className="mt-2">
            <StatusBadge value={order?.paymentStatus} toneMap={PAYMENT_STATUS_TONES} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/2">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Order total
          </p>
          <p className="mt-2 break-words text-lg font-semibold text-gray-800 dark:text-white/90">
            {formatCurrency(order?.totalPrice)}
          </p>
        </div>
      </div>

      <Section title="Customer">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <DetailItem label="Name" value={normalizeText(customer?.name) || "Customer unavailable"} />
          <DetailItem label="Email" value={normalizeText(customer?.email)} />
          <DetailItem label="Phone" value={normalizeText(customer?.phone)} />
        </dl>
      </Section>

      <Section title="Shipping address">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <DetailItem label="Recipient" value={normalizeText(address?.fullname)} />
          <DetailItem label="Phone" value={normalizeText(address?.phone)} />
          <DetailItem label="Address type" value={formatLabel(address?.addressType)} />
          <DetailItem label="Address" value={addressLines.join(", ")} />
        </dl>
      </Section>

      <Section title={`Items (${orderItems.length})`}>
        {orderItems.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {orderItems.map((item, index) => (
              <OrderItem key={`${getEntityId(item?.product) || getItemName(item)}-${index}`} item={item} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Item information is unavailable.
          </p>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Financial summary">
          <FinancialRow label="Items subtotal" value={order?.itemsPrice} />
          <FinancialRow label="Shipping" value={order?.shippingCharge} />
          <FinancialRow label="Tax" value={order?.taxPrice} />
          <FinancialRow label="Discount" value={order?.discount} />
          <FinancialRow label="Order total" value={order?.totalPrice} emphasized />
        </Section>

        <Section title="Payment and fulfillment">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <DetailItem label="Payment method" value={formatLabel(order?.paymentMethod)} />
            <DetailItem label="Tracking ID" value={normalizeText(order?.trackingId)} />
            <DetailItem label="Placed" value={formatDateTime(order?.createdAt)} />
            <DetailItem label="Paid" value={formatDateTime(order?.paidAt)} />
            <DetailItem label="Delivered" value={formatDateTime(order?.deliveredAt)} />
            <DetailItem label="Cancelled" value={formatDateTime(order?.cancelledAt)} />
            <DetailItem label="Cancellation reason" value={normalizeText(order?.cancelReason)} />
            <DetailItem label="Last updated" value={formatDateTime(order?.updatedAt)} />
          </dl>
        </Section>
      </div>
    </div>
  );
}

function OrderDetailsModal({
  isOpen,
  details = null,
  fallbackOrder = null,
  error = "",
  isLoading = false,
  onClose = () => {},
  onRetry = () => {},
}) {
  const modalId = useId();
  const modalRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  const fullOrder = normalizeObject(details);
  const fallback = normalizeObject(fallbackOrder);
  const displayedOrder = fullOrder ?? (error ? fallback : null);
  const isFallback = Boolean(!fullOrder && error && fallback);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const modalElement = modalRef.current;
    const documentElement = document.documentElement;
    const previouslyFocusedElement = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const previousDocumentOverflow = documentElement.style.overflow;
    const previousDocumentScrollbarGutter =
      documentElement.style.scrollbarGutter;
    const scrollbarGutterWidth = Math.max(
      0,
      window.innerWidth - documentElement.clientWidth
    );
    const computedBodyPaddingRight =
      Number.parseFloat(window.getComputedStyle(document.body).paddingRight) ||
      0;

    function getFocusableElements() {
      if (!modalElement) {
        return [];
      }

      return Array.from(
        modalElement.querySelectorAll(FOCUSABLE_ELEMENT_SELECTOR)
      ).filter(
        (element) =>
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0
      );
    }

    function handleKeyDown(event) {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        modalElement?.focus();
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];

      if (!focusableElements.includes(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey
          ? lastFocusableElement
          : firstFocusableElement
        ).focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    }

    documentElement.style.scrollbarGutter = "auto";

    if (scrollbarGutterWidth > 0) {
      document.body.style.paddingRight = `${
        computedBodyPaddingRight + scrollbarGutterWidth
      }px`;
    }

    document.body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    const focusFrameId = window.requestAnimationFrame(() => {
      const firstFocusableElement = getFocusableElements()[0];

      if (firstFocusableElement) {
        firstFocusableElement.focus();
      } else {
        modalElement?.focus();
      }
    });

    return () => {
      window.cancelAnimationFrame(focusFrameId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
      documentElement.style.overflow = previousDocumentOverflow;
      documentElement.style.scrollbarGutter =
        previousDocumentScrollbarGutter;

      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-99999 overflow-hidden p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-gray-400/50 backdrop-blur-[32px]"
        onClick={onClose}
      />

      <div className="relative z-10 flex h-full min-h-0 items-center justify-center">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className="relative flex max-h-[calc(100dvh-1.5rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white sm:max-h-[calc(100dvh-3rem)] dark:bg-gray-900"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:top-6 sm:right-6 sm:h-11 sm:w-11"
          >
            <span className="sr-only">Close modal</span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>

        <div className="shrink-0 border-b border-gray-100 px-5 py-5 pr-16 sm:px-8 sm:pr-20 dark:border-gray-800">
          <h3 id={titleId} className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Order details
          </h3>
          <p id={descriptionId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formatOrderReference(displayedOrder ?? fallbackOrder)} · Read-only Order record
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {isLoading && <DetailsSkeleton />}

          {!isLoading && isFallback && (
            <div className="mx-5 mt-5 rounded-xl border border-warning-200 bg-warning-50 px-4 py-4 sm:mx-8 dark:border-warning-500/30 dark:bg-warning-500/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-sm text-warning-700 dark:text-warning-400">
                  <p className="font-medium">Full Order details could not be loaded.</p>
                  <p className="mt-1 break-words text-xs">
                    Showing the read-only list record. Some fields may be unavailable. {error}
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={onRetry} className="shrink-0">
                  Try again
                </Button>
              </div>
            </div>
          )}

          {!isLoading && error && !fallback && (
            <div className="px-5 py-12 text-center sm:px-8">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Order details could not be loaded
              </p>
              <p className="mx-auto mt-2 max-w-lg break-words whitespace-pre-wrap text-sm text-error-600 dark:text-error-400">
                {error}
              </p>
              <Button type="button" variant="outline" onClick={onRetry} className="mt-5">
                Try again
              </Button>
            </div>
          )}

          {!isLoading && displayedOrder && <OrderDetailsContent order={displayedOrder} />}

          {!isLoading && !error && !displayedOrder && (
            <div className="px-5 py-12 text-center sm:px-8">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Order details are unavailable
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The server returned an unexpected response.
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 px-5 py-4 text-right sm:px-8 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;

import { useId, useState } from "react";

import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";
import { ReturnStatusBadge } from "./ReturnsTable.jsx";

const EMPTY_VALUE = "\u2014";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

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

function formatId(entity) {
  const id = getEntityId(entity);

  return id ? `#${id.toUpperCase()}` : EMPTY_VALUE;
}

function formatCurrency(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? currencyFormatter.format(value)
    : EMPTY_VALUE;
}

function formatDate(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return EMPTY_VALUE;
  }

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : dateFormatter.format(date);
}

function formatQuantity(value) {
  return Number.isInteger(value) && value > 0 ? String(value) : EMPTY_VALUE;
}

function DetailItem({ label, value, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-gray-800 dark:text-white/90">
        {value || EMPTY_VALUE}
      </dd>
    </div>
  );
}

function DetailsSection({ title, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-gray-200 p-4 sm:p-5 dark:border-gray-800">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h4>
      <dl className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

function EvidenceThumbnail({ source, index, onPreview }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-center text-xs text-gray-500 dark:border-gray-800 dark:bg-white/2 dark:text-gray-400">
        Evidence preview unavailable
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPreview(source)}
      className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-800 dark:bg-white/2"
    >
      <img
        src={source}
        alt={`Return evidence ${index + 1}`}
        className="size-full object-cover transition group-hover:scale-105"
        onError={() => setHasError(true)}
      />
      <span className="absolute inset-x-0 bottom-0 bg-gray-900/70 px-2 py-1.5 text-xs font-medium text-white">
        View evidence
      </span>
    </button>
  );
}

function ProductImage({ source, name }) {
  const [hasError, setHasError] = useState(false);

  if (!source || hasError) {
    return (
      <div className="flex size-20 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-2 text-center text-xs text-gray-500 dark:border-gray-800 dark:bg-white/2 dark:text-gray-400">
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={name ? `${name} Product` : "Returned Product"}
      className="size-20 rounded-xl border border-gray-200 object-cover dark:border-gray-800"
      onError={() => setHasError(true)}
    />
  );
}

function ReturnDetailsModal({
  isOpen,
  selectedReturn = null,
  details = null,
  detailsReturnId = "",
  isLoading = false,
  error = "",
  onClose = () => {},
  onRetry = () => {},
}) {
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  const [previewSource, setPreviewSource] = useState("");
  const selectedReturnId = getEntityId(selectedReturn);
  const hasCurrentDetails = Boolean(
    details && detailsReturnId && detailsReturnId === selectedReturnId
  );
  const returnRequest = hasCurrentDetails ? details : selectedReturn;
  const returnId = getEntityId(returnRequest) || selectedReturnId;
  const orderRelation = returnRequest?.order ?? null;
  const productRelation = returnRequest?.product ?? null;
  const customerRelation = returnRequest?.customer ?? null;
  const sellerRelation = returnRequest?.seller ?? null;
  const order = normalizeObject(orderRelation);
  const product = normalizeObject(productRelation);
  const customer = normalizeObject(customerRelation);
  const seller = normalizeObject(sellerRelation);
  const images = Array.isArray(returnRequest?.images)
    ? returnRequest.images.map(normalizeText).filter(Boolean)
    : [];
  const productImages = Array.isArray(product?.images)
    ? product.images.map(normalizeText).filter(Boolean)
    : [];
  const productName = normalizeText(product?.name);

  function handleClose() {
    setPreviewSource("");
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-h-[92vh] max-w-6xl overflow-hidden"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <div className="flex max-h-[92vh] min-w-0 flex-col">
        <div className="shrink-0 border-b border-gray-100 px-5 pt-7 pb-5 pr-16 sm:px-8 sm:pt-8 sm:pr-20 dark:border-gray-800">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h3
              id={titleId}
              className="break-all text-xl font-semibold text-gray-800 dark:text-white/90"
            >
              Return {formatId(returnId)}
            </h3>
            <ReturnStatusBadge value={returnRequest?.status} />
          </div>
          <p
            id={descriptionId}
            className="mt-1.5 text-sm leading-6 text-gray-500 dark:text-gray-400"
          >
            Direct Return record details and submitted evidence.
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          {isLoading && (
            <div role="status" className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400">
              Loading the latest Return details. The list record remains visible below.
            </div>
          )}

          {error && (
            <div role="alert" className="mb-5 flex min-w-0 flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 sm:flex-row sm:items-center sm:justify-between dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              <div className="min-w-0 break-words">
                <p className="font-medium">The latest Return details could not be loaded.</p>
                <p className="mt-1 text-xs">{error}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onRetry}
                disabled={isLoading}
                className="shrink-0"
              >
                Try again
              </Button>
            </div>
          )}

          {returnRequest ? (
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <DetailsSection title="Return request">
                <DetailItem label="Return ID" value={formatId(returnId)} />
                <DetailItem label="Status" value={normalizeText(returnRequest?.status) || EMPTY_VALUE} />
                <DetailItem label="Quantity" value={formatQuantity(returnRequest?.quantity)} />
                <DetailItem label="Refund amount" value={formatCurrency(returnRequest?.refundAmount)} />
                <DetailItem label="Requested" value={formatDate(returnRequest?.createdAt)} />
                <DetailItem label="Updated" value={formatDate(returnRequest?.updatedAt)} />
              </DetailsSection>

              <DetailsSection title="Order">
                <DetailItem label="Order ID" value={formatId(orderRelation)} />
                <DetailItem label="Order total" value={formatCurrency(order?.totalPrice)} />
                <DetailItem label="Payment status" value={normalizeText(order?.paymentStatus) || EMPTY_VALUE} />
                <DetailItem label="Order status" value={normalizeText(order?.orderStatus) || EMPTY_VALUE} />
              </DetailsSection>

              <DetailsSection title="Product">
                <DetailItem label="Product" value={productName || getEntityId(productRelation) || EMPTY_VALUE} />
                <DetailItem label="Current Product price" value={formatCurrency(product?.price)} />
                <DetailItem
                  label="Current Product image"
                  value={<ProductImage source={productImages[0]} name={productName} />}
                  className="sm:col-span-2"
                />
              </DetailsSection>

              <DetailsSection title="Customer">
                <DetailItem label="Name" value={normalizeText(customer?.name) || getEntityId(customerRelation) || EMPTY_VALUE} />
                <DetailItem label="Email" value={normalizeText(customer?.email) || EMPTY_VALUE} />
                <DetailItem label="Phone" value={normalizeText(customer?.phone) || EMPTY_VALUE} />
              </DetailsSection>

              <DetailsSection title="Seller">
                <DetailItem label="Shop" value={normalizeText(seller?.shopName) || EMPTY_VALUE} />
                <DetailItem label="Name" value={normalizeText(seller?.name) || getEntityId(sellerRelation) || EMPTY_VALUE} />
                <DetailItem label="Email" value={normalizeText(seller?.email) || EMPTY_VALUE} />
              </DetailsSection>

              <DetailsSection title="Reason and resolution">
                <DetailItem label="Reason" value={normalizeText(returnRequest?.reason) || EMPTY_VALUE} />
                <DetailItem label="Description" value={normalizeText(returnRequest?.description) || EMPTY_VALUE} className="sm:col-span-2" />
                <DetailItem label="Rejection reason" value={normalizeText(returnRequest?.rejectedReason) || EMPTY_VALUE} className="sm:col-span-2" />
                <DetailItem label="Refund note" value={normalizeText(returnRequest?.refundNote) || EMPTY_VALUE} className="sm:col-span-2" />
                <DetailItem label="Refunded" value={formatDate(returnRequest?.refundedAt)} />
              </DetailsSection>

              <DetailsSection title="Timeline">
                <DetailItem label="Requested" value={formatDate(returnRequest?.createdAt)} />
                <DetailItem label="Last updated" value={formatDate(returnRequest?.updatedAt)} />
                <DetailItem label="Refunded" value={formatDate(returnRequest?.refundedAt)} />
              </DetailsSection>

              <section className="min-w-0 rounded-xl border border-gray-200 p-4 sm:p-5 dark:border-gray-800">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Evidence
                </h4>
                {images.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((image, index) => (
                      <EvidenceThumbnail
                        key={`${image}-${index}`}
                        source={image}
                        index={index}
                        onPreview={setPreviewSource}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    No evidence images were provided.
                  </p>
                )}
              </section>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Return details are unavailable.
            </p>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-100 px-5 py-4 sm:px-8 sm:py-5 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Close
          </Button>
        </div>

        {previewSource && (
          <div className="absolute inset-0 z-20 flex min-w-0 flex-col bg-gray-950/95 p-4 sm:p-6">
            <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
              <p className="text-sm font-medium text-white">Return evidence preview</p>
              <button
                type="button"
                onClick={() => setPreviewSource("")}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Back to details
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto">
              <img
                src={previewSource}
                alt="Enlarged Return evidence"
                className="max-h-full max-w-full rounded-xl object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ReturnDetailsModal;

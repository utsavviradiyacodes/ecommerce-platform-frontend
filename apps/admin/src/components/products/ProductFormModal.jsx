import { useEffect, useId, useRef } from "react";
import { Controller, useWatch } from "react-hook-form";

import InputField from "../form/input/InputField.jsx";
import Label from "../form/Label.jsx";
import Select from "../form/Select.jsx";
import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";
import ProductImagesField from "./ProductImagesField.jsx";

function RequiredMark() {
  return <span className="text-error-500"> *</span>;
}

function FormSection({ id, title, description, children }) {
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-white/2"
    >
      <div className="mb-4 min-w-0">
        <h4
          id={id}
          className="text-base font-semibold text-gray-800 dark:text-white/90"
        >
          {title}
        </h4>

        {description && (
          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function getFieldErrorMessage(fieldError) {
  if (typeof fieldError?.message === "string") {
    return fieldError.message;
  }

  if (typeof fieldError?.root?.message === "string") {
    return fieldError.root.message;
  }

  if (Array.isArray(fieldError)) {
    const nestedError = fieldError.find(
      (itemError) => typeof itemError?.message === "string"
    );

    return nestedError?.message ?? "";
  }

  return "";
}

function ProductFormModal({
  isOpen,
  mode = "create",
  onClose = () => {},
  onSubmit = () => {},
  register,
  control,
  setValue,
  clearErrors,
  categoryOptions = [],
  subcategoryOptions = [],
  existingImages = [],
  errors = {},
  submitError = "",
  isSubmitting = false,
  hasMeaningfulChanges = false,
  relationshipsLocked = false,
  dependencyMessage = "",
  tagsHint = "Separate tags with commas. Empty entries are ignored.",
  isCategoryLoading = false,
  isSubcategoryLoading = false,
}) {
  const submitErrorRef = useRef(null);
  const modalId = useId();
  const isEditMode = mode === "edit";
  const selectedCategoryId = useWatch({
    control,
    name: "categoryId",
  });

  const modalTitleId = `${modalId}-title`;
  const modalDescriptionId = `${modalId}-description`;
  const basicSectionId = `${modalId}-basic-section`;
  const pricingSectionId = `${modalId}-pricing-section`;
  const classificationSectionId = `${modalId}-classification-section`;
  const tagsSectionId = `${modalId}-tags-section`;
  const imagesSectionId = `${modalId}-images-section`;
  const nameInputId = `${modalId}-name`;
  const descriptionInputId = `${modalId}-description-input`;
  const priceInputId = `${modalId}-price`;
  const originalPriceInputId = `${modalId}-original-price`;
  const stockInputId = `${modalId}-stock`;
  const categoryInputId = `${modalId}-category`;
  const subcategoryInputId = `${modalId}-subcategory`;
  const tagsInputId = `${modalId}-tags`;
  const imagesInputId = `${modalId}-images`;

  const modalTitle = isEditMode ? "Edit Product" : "Add Product";
  const modalDescription = isEditMode
    ? "Update only the Product information that needs to change. Existing images remain unless you select a complete replacement set."
    : "Add a Product to the marketplace catalog with its pricing, classification, stock, tags, and complete image set.";
  const submitLabel = isEditMode ? "Save changes" : "Add Product";
  const pendingSubmitLabel = isEditMode ? "Saving..." : "Adding...";
  const classificationLockMessage =
    dependencyMessage ||
    "Classification options are unavailable right now. The current Category and Subcategory will be preserved while you edit other Product fields.";

  const nameError = getFieldErrorMessage(errors.name);
  const descriptionError = getFieldErrorMessage(errors.description);
  const priceError = getFieldErrorMessage(errors.price);
  const originalPriceError = getFieldErrorMessage(errors.originalPrice);
  const stockError = getFieldErrorMessage(errors.stock);
  const categoryError = getFieldErrorMessage(errors.categoryId);
  const subcategoryError = getFieldErrorMessage(errors.subcategoryId);
  const tagsError = getFieldErrorMessage(errors.tags);
  const imagesError = getFieldErrorMessage(errors.images);
  const descriptionHintId = descriptionError
    ? `${descriptionInputId}-hint`
    : undefined;

  function handleClose() {
    if (!isSubmitting) {
      onClose();
    }
  }

  useEffect(() => {
    if (!isOpen || !submitError) {
      return undefined;
    }

    const errorFrameId = window.requestAnimationFrame(() => {
      submitErrorRef.current?.scrollIntoView({ block: "nearest" });
    });

    return () => {
      window.cancelAnimationFrame(errorFrameId);
    };
  }, [isOpen, submitError]);

  const textareaClasses = `min-h-32 w-full resize-y rounded-lg border bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus-visible:outline-hidden focus-visible:ring-3 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-40 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-400 ${
    descriptionError
      ? "border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500/30 dark:border-error-500 dark:focus-visible:border-error-400 dark:focus-visible:ring-error-400/30"
      : "border-gray-300 focus-visible:border-brand-400 focus-visible:ring-brand-500/30 dark:border-gray-700 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/30"
  }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-5xl"
      showCloseButton={!isSubmitting}
      ariaLabelledBy={modalTitleId}
      ariaDescribedBy={modalDescriptionId}
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex max-h-[calc(100dvh-1.5rem)] min-w-0 flex-col overflow-hidden rounded-3xl sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="shrink-0 px-5 pt-6 pr-14 pb-4 sm:px-8 sm:pt-8 sm:pr-20 sm:pb-5">
          <h3
            id={modalTitleId}
            className="text-xl font-semibold text-gray-800 dark:text-white/90"
          >
            {modalTitle}
          </h3>

          <p
            id={modalDescriptionId}
            className="mt-1.5 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400"
          >
            {modalDescription}
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain border-y border-gray-100 bg-gray-50/50 px-4 py-4 sm:px-8 sm:py-5 dark:border-gray-800 dark:bg-white/[0.01]">
          {submitError && (
            <div
              ref={submitErrorRef}
              role="alert"
              className="mb-5 min-w-0 break-words whitespace-pre-wrap rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              {submitError}
            </div>
          )}

          <div className="min-w-0 space-y-5">
            <FormSection
              id={basicSectionId}
              title="Basic information"
              description="Use a clear customer-facing name and a useful catalog description."
            >
              <div className="grid min-w-0 gap-5">
                <div className="min-w-0">
                  <Label htmlFor={nameInputId}>
                    Product name
                    <RequiredMark />
                  </Label>

                  <InputField
                    {...register("name")}
                    id={nameInputId}
                    type="text"
                    placeholder="Enter Product name"
                    autoComplete="off"
                    maxLength={100}
                    error={Boolean(nameError)}
                    hint={nameError}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="min-w-0">
                  <Label htmlFor={descriptionInputId}>
                    Description
                    <RequiredMark />
                  </Label>

                  <textarea
                    {...register("description")}
                    id={descriptionInputId}
                    rows={5}
                    maxLength={2000}
                    placeholder="Describe the Product, its key features, and relevant customer information"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(descriptionError) || undefined}
                    aria-describedby={descriptionHintId}
                    className={textareaClasses}
                  />

                  {descriptionError && (
                    <p
                      id={descriptionHintId}
                      className="mt-1.5 text-xs text-error-600 dark:text-error-400"
                    >
                      {descriptionError}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            <FormSection
              id={pricingSectionId}
              title="Pricing and stock"
              description="Original price is optional. Stock can be zero when editing an existing Product."
            >
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="min-w-0">
                  <Label htmlFor={priceInputId}>
                    Price
                    <RequiredMark />
                  </Label>

                  <InputField
                    {...register("price")}
                    id={priceInputId}
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    error={Boolean(priceError)}
                    hint={priceError}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="min-w-0">
                  <Label htmlFor={originalPriceInputId}>
                    Original price
                    <span className="font-normal text-gray-500 dark:text-gray-400">
                      {" "}
                      (optional)
                    </span>
                  </Label>

                  <InputField
                    {...register("originalPrice")}
                    id={originalPriceInputId}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    error={Boolean(originalPriceError)}
                    hint={
                      originalPriceError ||
                      (isEditMode
                        ? "Leave blank to clear the current original price."
                        : "Optional compare-at price; it must be at least the current price.")
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor={stockInputId}>
                    Stock
                    <RequiredMark />
                  </Label>

                  <InputField
                    {...register("stock")}
                    id={stockInputId}
                    type="number"
                    inputMode="numeric"
                    min={isEditMode ? "0" : "1"}
                    step="1"
                    placeholder={isEditMode ? "0" : "1"}
                    error={Boolean(stockError)}
                    hint={stockError}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              id={classificationSectionId}
              title="Classification"
              description="Choose a Category first, then select one of its Subcategories."
            >
              {isEditMode && relationshipsLocked && (
                <div className="mb-4 min-w-0 break-words rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
                  {classificationLockMessage}
                </div>
              )}

              <div className="grid min-w-0 gap-5 md:grid-cols-2">
                <div className="min-w-0">
                  <Label htmlFor={categoryInputId}>
                    Category
                    <RequiredMark />
                  </Label>

                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        ref={field.ref}
                        id={categoryInputId}
                        name={field.name}
                        options={categoryOptions}
                        value={field.value ?? ""}
                        onChange={(nextCategoryId) => {
                          if (!Object.is(nextCategoryId, field.value)) {
                            field.onChange(nextCategoryId);

                            setValue("subcategoryId", "", {
                              shouldDirty: true,
                              shouldTouch: false,
                              shouldValidate: false,
                            });

                            clearErrors("subcategoryId");
                          }
                        }}
                        onBlur={field.onBlur}
                        placeholder="Select Category"
                        error={Boolean(categoryError)}
                        hint={categoryError}
                        disabled={isSubmitting || relationshipsLocked}
                        isSearchable={categoryOptions.length > 0}
                        searchPlaceholder="Search Categories..."
                        isLoading={isCategoryLoading}
                        loadingMessage="Loading Categories..."
                        noOptionsMessage="No Categories found."
                      />
                    )}
                  />
                </div>

                <div className="min-w-0">
                  <Label htmlFor={subcategoryInputId}>
                    Subcategory
                    <RequiredMark />
                  </Label>

                  <Controller
                    name="subcategoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        ref={field.ref}
                        id={subcategoryInputId}
                        name={field.name}
                        options={subcategoryOptions}
                        value={field.value ?? ""}
                        onChange={(nextSubcategoryId) => {
                          field.onChange(nextSubcategoryId);

                          if (nextSubcategoryId) {
                            clearErrors("subcategoryId");
                          }
                        }}
                        onBlur={field.onBlur}
                        placeholder={
                          selectedCategoryId
                            ? "Select Subcategory"
                            : "Select a Category first"
                        }
                        error={Boolean(subcategoryError)}
                        hint={
                          subcategoryError ||
                          (!selectedCategoryId && !relationshipsLocked
                            ? "Select a Category before choosing a Subcategory."
                            : "")
                        }
                        disabled={
                          isSubmitting ||
                          relationshipsLocked ||
                          !selectedCategoryId
                        }
                        isSearchable={subcategoryOptions.length > 0}
                        searchPlaceholder="Search Subcategories..."
                        isLoading={isSubcategoryLoading}
                        loadingMessage="Loading Subcategories..."
                        noOptionsMessage="No Subcategories found for this Category."
                      />
                    )}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              id={tagsSectionId}
              title="Tags"
              description="Tags help describe and discover this Product."
            >
              <div className="min-w-0">
                <Label htmlFor={tagsInputId}>
                  Tags
                  <span className="font-normal text-gray-500 dark:text-gray-400">
                    {" "}
                    (optional)
                  </span>
                </Label>

                <InputField
                  {...register("tags")}
                  id={tagsInputId}
                  type="text"
                  placeholder="featured, seasonal, gift"
                  autoComplete="off"
                  error={Boolean(tagsError)}
                  hint={tagsError || tagsHint}
                  disabled={isSubmitting}
                />
              </div>
            </FormSection>

            <FormSection
              id={imagesSectionId}
              title="Images"
              description={
                isEditMode
                  ? "Current images remain unchanged unless a complete replacement set is selected."
                  : "Add the complete image set customers should see for this Product."
              }
            >
              <ProductImagesField
                id={imagesInputId}
                inputProps={register("images")}
                setValue={setValue}
                existingImages={existingImages}
                mode={mode}
                error={imagesError}
                disabled={isSubmitting}
              />
            </FormSection>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || (isEditMode && !hasMeaningfulChanges)}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? pendingSubmitLabel : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;

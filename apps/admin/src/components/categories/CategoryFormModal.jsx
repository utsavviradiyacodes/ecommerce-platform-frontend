import { useEffect, useId, useRef, useState } from "react";
import { useWatch } from "react-hook-form";

import Button from "../ui/button/Button.jsx";
import FileInput from "../form/input/FileInput.jsx";
import InputField from "../form/input/InputField.jsx";
import Label from "../form/Label.jsx";
import Modal from "../ui/modal/Modal.jsx";

function CategoryFormModal({
  isOpen,
  mode = "create",
  onClose = () => {},
  onSubmit = () => {},
  nameInputProps = {},
  imageInputProps = {},
  control,
  originalCategory = null,
  previewUrl = "",
  nameError = "",
  imageError = "",
  submitError = "",
  isSubmitting = false,
  isSubmitDisabled = false,
}) {
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState("");
  const [hasReplacementImage, setHasReplacementImage] = useState(false);
  const objectUrlRef = useRef("");
  const submitErrorRef = useRef(null);

  const isEditMode = mode === "edit";

  const modalId = useId();
  const modalTitleId = `${modalId}-title`;
  const modalDescriptionId = `${modalId}-description`;

  const modalTitle = isEditMode ? "Edit category" : "Add category";
  const modalDescription = isEditMode
    ? "Update the category name or replace its current image."
    : "Create a category that can later be used to organize subcategories and products.";

  const submitLabel = isEditMode ? "Save changes" : "Add category";

  const displayedPreviewUrl = selectedPreviewUrl || previewUrl;

  const currentName = useWatch({
    control,
    name: "name",
  });

  const hasMeaningfulChanges =
    !isEditMode ||
    (typeof currentName === "string" ? currentName.trim() : "") !==
      (typeof originalCategory?.name === "string"
        ? originalCategory.name.trim()
        : "") ||
    hasReplacementImage;

  const { onChange: forwardedImageChange, ...remainingImageInputProps } =
    imageInputProps;

  function clearSelectedPreview() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    setSelectedPreviewUrl("");
    setHasReplacementImage(false);
  }

  function handleImageChange(event) {
    const selectedFile = event.target.files?.[0] ?? null;

    setHasReplacementImage(Boolean(selectedFile));

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const nextPreviewUrl = URL.createObjectURL(selectedFile);

      objectUrlRef.current = nextPreviewUrl;
      setSelectedPreviewUrl(nextPreviewUrl);
    } else {
      setSelectedPreviewUrl("");
    }

    forwardedImageChange?.(event);
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    clearSelectedPreview();
    onClose();
  }

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!submitError) {
      return undefined;
    }

    const errorFrameId = window.requestAnimationFrame(() => {
      submitErrorRef.current?.scrollIntoView({ block: "nearest" });
    });

    return () => {
      window.cancelAnimationFrame(errorFrameId);
    };
  }, [submitError]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-190"
      ariaLabelledBy={modalTitleId}
      ariaDescribedBy={modalDescriptionId}
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-3xl sm:max-h-[calc(100dvh-3rem)]"
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
            className="mt-1.5 min-h-15 max-w-xl text-sm text-gray-500 sm:min-h-10 dark:text-gray-400"
          >
            {modalDescription}
          </p>
        </div>

        <div className="min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain border-y border-gray-100 px-5 py-4 sm:px-8 sm:py-5 dark:border-gray-800">
          {submitError && (
            <div
              ref={submitErrorRef}
              role="alert"
              className="mb-5 min-w-0 break-words whitespace-pre-wrap rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              {submitError}
            </div>
          )}

          <div>
            <Label htmlFor="category-name">
              Category name
              <span className="text-error-500"> *</span>
            </Label>

            <InputField
              {...nameInputProps}
              id="category-name"
              type="text"
              placeholder="Enter category name"
              autoComplete="off"
              error={Boolean(nameError)}
              hint={nameError}
              disabled={isSubmitting}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 md:items-stretch">
            <div className="order-2 flex min-h-36 flex-col md:order-1 md:h-full">
              <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-400">
                Image preview
              </p>

              <div className="flex min-h-28 flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 sm:min-h-36 sm:p-4 dark:border-gray-700 dark:bg-white/2">
                {displayedPreviewUrl ? (
                  <div className="flex w-full items-center justify-center">
                    <div className="h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-white sm:h-24 sm:w-24 dark:border-gray-800 dark:bg-gray-900">
                      <img
                        src={displayedPreviewUrl}
                        alt="Category preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 32 32"
                      fill="none"
                      className="mx-auto text-gray-400"
                    >
                      <path
                        d="M6.66699 25.3333L12.667 19.3333C13.7075 18.2928 15.3945 18.2928 16.435 19.3333L18.667 21.5653L20.899 19.3333C21.9395 18.2928 23.6265 18.2928 24.667 19.3333L26.667 21.3333M10.667 12C10.667 13.4728 9.47309 14.6667 8.00033 14.6667C6.52757 14.6667 5.33366 13.4728 5.33366 12C5.33366 10.5272 6.52757 9.33333 8.00033 9.33333C9.47309 9.33333 10.667 10.5272 10.667 12ZM5.33366 28H26.667C28.1398 28 29.3337 26.8061 29.3337 25.3333V6.66667C29.3337 5.19391 28.1398 4 26.667 4H5.33366C3.8609 4 2.66699 5.19391 2.66699 6.66667V25.3333C2.66699 26.8061 3.8609 28 5.33366 28Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      No image selected
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Your selected image will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="order-1 md:order-2">
              <Label htmlFor="category-image">Category image</Label>

              <FileInput
                {...remainingImageInputProps}
                id="category-image"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                error={Boolean(imageError)}
                hint={
                  imageError ||
                  "Choose a PNG, JPG, JPEG, or WebP image up to 5 MB."
                }
                disabled={isSubmitting}
              />

              <div className="mt-4 hidden rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 sm:block dark:border-gray-800 dark:bg-white/2">
                <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Use a clear square image where possible. The image will appear
                  beside the category name throughout the admin panel.
                </p>
              </div>
            </div>
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
            disabled={
              isSubmitting ||
              isSubmitDisabled ||
              (isEditMode && !hasMeaningfulChanges)
            }
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CategoryFormModal;

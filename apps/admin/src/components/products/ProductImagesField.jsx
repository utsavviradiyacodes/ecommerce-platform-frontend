import { useEffect, useRef, useState } from "react";

import FileInput from "../form/input/FileInput.jsx";
import Label from "../form/Label.jsx";
import Button from "../ui/button/Button.jsx";

const ACCEPTED_PRODUCT_IMAGE_TYPES = "image/jpeg,image/png,image/webp";

function revokeObjectUrls(objectUrls) {
  objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
}

function getExistingImageUrl(image) {
  if (typeof image === "string") {
    return image.trim();
  }

  if (!image || typeof image !== "object") {
    return "";
  }

  const candidateUrl = image.secure_url ?? image.url ?? image.src ?? "";

  return typeof candidateUrl === "string" ? candidateUrl.trim() : "";
}

function ProductImagesField({
  id = "product-images",
  inputProps = {},
  setValue,
  existingImages = [],
  mode = "create",
  error = "",
  disabled = false,
}) {
  const [previewUrls, setPreviewUrls] = useState([]);
  const [inputResetKey, setInputResetKey] = useState(0);
  const ownedObjectUrlsRef = useRef([]);

  const {
    ref: forwardedRef,
    name = "images",
    onBlur: forwardedOnBlur,
    onChange: forwardedOnChange,
    ...remainingInputProps
  } = inputProps;

  const existingImageUrls = Array.isArray(existingImages)
    ? existingImages.map(getExistingImageUrl).filter(Boolean)
    : [];
  const isEditMode = mode === "edit";
  const hasReplacementImages = previewUrls.length > 0;
  const displayedImageUrls = hasReplacementImages
    ? previewUrls
    : isEditMode
      ? existingImageUrls
      : [];

  function releaseOwnedPreviews() {
    revokeObjectUrls(ownedObjectUrlsRef.current);
    ownedObjectUrlsRef.current = [];
  }

  function handleImageChange(event) {
    const selectedFiles = Array.from(event.target.files ?? []);

    releaseOwnedPreviews();

    const nextPreviewUrls = selectedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    ownedObjectUrlsRef.current = nextPreviewUrls;
    setPreviewUrls(nextPreviewUrls);
    forwardedOnChange?.(event);
  }

  function handleClearSelection() {
    releaseOwnedPreviews();
    setPreviewUrls([]);

    setValue(name, null, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setInputResetKey((currentKey) => currentKey + 1);
  }

  useEffect(() => {
    return () => {
      revokeObjectUrls(ownedObjectUrlsRef.current);
      ownedObjectUrlsRef.current = [];
    };
  }, []);

  const fieldHint =
    error ||
    (isEditMode
      ? "Choose 1 to 5 JPG, JPEG, PNG, or WebP images up to 5 MB each to replace the current set."
      : "Choose 1 to 5 JPG, JPEG, PNG, or WebP images up to 5 MB each.");

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Label htmlFor={id}>
            Product images
            {!isEditMode && <span className="text-error-500"> *</span>}
          </Label>

          <FileInput
            {...remainingInputProps}
            key={inputResetKey}
            ref={forwardedRef}
            id={id}
            name={name}
            accept={ACCEPTED_PRODUCT_IMAGE_TYPES}
            multiple
            onBlur={forwardedOnBlur}
            onChange={handleImageChange}
            error={Boolean(error)}
            hint={fieldHint}
            disabled={disabled}
          />
        </div>

        {hasReplacementImages && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleClearSelection}
            disabled={disabled}
            className="w-full shrink-0 sm:mt-6 sm:w-auto"
          >
            {isEditMode ? "Clear replacement" : "Clear selection"}
          </Button>
        )}
      </div>

      {isEditMode && hasReplacementImages && (
        <div
          role="note"
          className="mt-4 min-w-0 break-words rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"
        >
          New images will replace all existing Product images. Select the
          complete final image set.
        </div>
      )}

      <div className="mt-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isEditMode
              ? hasReplacementImages
                ? "Selected replacement images"
                : "Existing images"
              : "Selected images"}
          </p>

          {displayedImageUrls.length > 0 && (
            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {displayedImageUrls.length} of 5
            </span>
          )}
        </div>

        {displayedImageUrls.length > 0 ? (
          <ul
            className="mt-2 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            aria-label={
              hasReplacementImages
                ? "Selected Product image previews"
                : "Existing Product images"
            }
          >
            {displayedImageUrls.map((imageUrl, imageIndex) => (
              <li
                key={`${imageUrl}-${imageIndex}`}
                className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-1.5 dark:border-gray-800 dark:bg-white/2"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-white dark:bg-gray-900">
                  <img
                    src={imageUrl}
                    alt={
                      hasReplacementImages
                        ? `Selected Product image preview ${imageIndex + 1}`
                        : `Existing Product image ${imageIndex + 1}`
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-7 text-center dark:border-gray-700 dark:bg-white/2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isEditMode
                ? "No existing Product images are available."
                : "No Product images selected."}
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isEditMode
                ? "Select the complete replacement image set above if needed."
                : "Selected images will be previewed here."}
            </p>
          </div>
        )}

        {isEditMode && !hasReplacementImages && existingImageUrls.length > 0 && (
          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
            Existing images are read-only. They remain unchanged unless you
            select a complete replacement set.
          </p>
        )}
      </div>
    </div>
  );
}

export default ProductImagesField;

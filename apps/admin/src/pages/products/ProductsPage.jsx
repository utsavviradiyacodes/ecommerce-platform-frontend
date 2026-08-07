import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch, useSelector, useStore } from "react-redux";
import { zodResolver } from "@hookform/resolvers/zod";

import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";
import ProductApproveModal from "../../components/products/ProductApproveModal.jsx";
import ProductArchiveModal from "../../components/products/ProductArchiveModal.jsx";
import ProductDetailsModal from "../../components/products/ProductDetailsModal.jsx";
import ProductFormModal from "../../components/products/ProductFormModal.jsx";
import ProductRejectModal from "../../components/products/ProductRejectModal.jsx";
import ProductsTable from "../../components/products/ProductsTable.jsx";
import ProductsToolbar from "../../components/products/ProductsToolbar.jsx";
import { selectAdminSessionGeneration } from "../../features/auth/authSlice.js";

import {
  fetchCategoriesThunk,
  selectCategories,
  selectCategoriesListError,
  selectCategoriesListStatus,
  selectIsCategoriesListPending,
} from "../../features/categories/categoriesSlice.js";
import {
  approveProductThunk,
  archiveProductThunk,
  clearApproveProductRequestFeedback,
  clearArchiveProductRequestFeedback,
  clearCreateProductRequestFeedback,
  clearProductDetails,
  clearProductMutationRequestFeedback,
  clearProductsListRefreshRequirement,
  clearRejectProductRequestFeedback,
  clearToggleProductRequestFeedback,
  clearUpdateProductRequestFeedback,
  createProductThunk,
  createProductsQueryKey,
  fetchProductDetailsThunk,
  fetchProductsThunk,
  getPendingProductsListRequest,
  getProductsListRequestSequence,
  PRODUCTS_PAGE_SIZE,
  rejectProductThunk,
  requestProductsListRefresh,
  requestProductsListThunk,
  selectIsProductApprovePending,
  selectIsProductArchivePending,
  selectIsProductCreatePending,
  selectIsProductRejectPending,
  selectIsProductTogglePending,
  selectIsProductUpdatePending,
  selectProductApproveError,
  selectProductApproveSuccessMessage,
  selectProductArchiveError,
  selectProductArchiveSuccessMessage,
  selectProductCreateError,
  selectProductCreateSuccessMessage,
  selectProductDetails,
  selectProductDetailsError,
  selectProductDetailsStatus,
  selectProductMutationTargetIds,
  selectProductRejectError,
  selectProductRejectSuccessMessage,
  selectProducts,
  selectProductsListError,
  selectProductsListRefreshRequirement,
  selectProductsListStatus,
  selectProductsLoadedQueryKey,
  selectProductsPage,
  selectProductsRequestedQueryKey,
  selectProductsTotal,
  selectProductsTotalPages,
  selectProductToggleError,
  selectProductToggleSuccessMessage,
  selectProductUpdateError,
  selectProductUpdateSuccessMessage,
  toggleProductStatusThunk,
  updateProductThunk,
} from "../../features/products/productsSlice.js";
import {
  fetchSubcategoriesThunk,
  selectIsSubcategoriesListPending,
  selectSubcategories,
  selectSubcategoriesListError,
  selectSubcategoriesListStatus,
} from "../../features/subcategories/subcategoriesSlice.js";

import {
  createProductSchema,
  updateProductSchema,
} from "../../schemas/products/productSchema.js";
import { REQUEST_STATUS } from "../../utils/redux/requestState.js";

const SEARCH_DEBOUNCE_MS = 350;

const RETRY_BUTTON_CLASSES =
  "inline-flex shrink-0 items-center justify-center rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-theme-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-transparent";

const FEEDBACK_TONES = {
  success: {
    container:
      "border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10",
    text: "text-success-700 dark:text-success-400",
    button:
      "border-success-300 text-success-700 hover:bg-success-100 focus-visible:outline-success-500 dark:border-success-500/40 dark:text-success-400 dark:hover:bg-success-500/10",
  },
  error: {
    container:
      "border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10",
    text: "text-error-700 dark:text-error-400",
    button:
      "border-error-300 text-error-700 hover:bg-error-100 focus-visible:outline-error-500 dark:border-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10",
  },
  warning: {
    container:
      "border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10",
    text: "text-warning-700 dark:text-warning-400",
    button:
      "border-warning-300 text-warning-700 hover:bg-warning-100 focus-visible:outline-warning-500 dark:border-warning-500/40 dark:text-warning-400 dark:hover:bg-warning-500/10",
  },
  neutral: {
    container:
      "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/2",
    text: "text-gray-600 dark:text-gray-400",
    button:
      "border-gray-300 text-gray-700 hover:bg-gray-100 focus-visible:outline-brand-500 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
  },
};

function getEmptyProductFormValues() {
  return {
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    stock: "",
    categoryId: "",
    subcategoryId: "",
    tags: "",
    images: null,
  };
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getRelationId(relation) {
  if (relation && typeof relation === "object") {
    return normalizeText(relation._id ?? relation.id);
  }

  return normalizeText(relation);
}

function getRelationName(relation, fallback) {
  if (relation && typeof relation === "object") {
    return normalizeText(relation.name) || fallback;
  }

  return fallback;
}

function getSubcategoryCategoryId(subcategory) {
  return getRelationId(subcategory?.category ?? subcategory?.categoryId);
}

function getTagParts(value) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return values.map(normalizeText).filter(Boolean);
}

function getTagsInputValue(value) {
  return getTagParts(value).join(", ");
}

function getTagsPayloadValue(value) {
  return getTagParts(value).join(",");
}

function getTagsComparisonValue(value) {
  return getTagParts(value)
    .map((tag) => tag.toLocaleLowerCase())
    .join(",");
}

function getImageFiles(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof FileList !== "undefined" && value instanceof FileList) {
    return Array.from(value);
  }

  if (typeof File !== "undefined" && value instanceof File) {
    return [value];
  }

  return [];
}

function getFiniteNumber(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getOptionalOriginalPrice(value) {
  const number = getFiniteNumber(value);

  return number !== null && number > 0 ? number : null;
}

function getNumericFormValue(value) {
  const number = getFiniteNumber(value);

  return number === null ? "" : String(number);
}

function getOriginalPriceFormValue(value) {
  const number = getOptionalOriginalPrice(value);

  return number === null ? "" : String(number);
}

function getProductEditFormValues(product) {
  return {
    name: normalizeText(product?.name),
    description: normalizeText(product?.description),
    price: getNumericFormValue(product?.price),
    originalPrice: getOriginalPriceFormValue(product?.originalPrice),
    stock: getNumericFormValue(product?.stock),
    categoryId: getRelationId(product?.category),
    subcategoryId: getRelationId(product?.subcategory),
    tags: getTagsInputValue(product?.tags),
    images: null,
  };
}

function buildCategoryOptions(categories, selectedProduct = null) {
  const options = categories.reduce((result, category) => {
    const categoryId = getRelationId(category);

    if (categoryId) {
      result.push({
        value: categoryId,
        label: normalizeText(category?.name) || "Unnamed Category",
      });
    }

    return result;
  }, []);

  const currentCategoryId = getRelationId(selectedProduct?.category);

  if (
    !currentCategoryId ||
    options.some((option) => option.value === currentCategoryId)
  ) {
    return options;
  }

  return [
    {
      value: currentCategoryId,
      label: `${getRelationName(
        selectedProduct?.category,
        "Current Category"
      )} (current)`,
    },
    ...options,
  ];
}

function buildSubcategoryRecords(subcategories) {
  return subcategories.reduce((records, subcategory) => {
    const subcategoryId = getRelationId(subcategory);
    const categoryId = getSubcategoryCategoryId(subcategory);

    if (subcategoryId && categoryId) {
      records.push({
        value: subcategoryId,
        label: normalizeText(subcategory?.name) || "Unnamed Subcategory",
        categoryId,
      });
    }

    return records;
  }, []);
}

function buildSubcategoryOptions(
  subcategoryRecords,
  selectedCategoryId,
  selectedProduct = null
) {
  const options = subcategoryRecords
    .filter((record) => record.categoryId === selectedCategoryId)
    .map(({ value, label }) => ({ value, label }));

  const currentCategoryId = getRelationId(selectedProduct?.category);
  const currentSubcategoryId = getRelationId(selectedProduct?.subcategory);

  if (
    !currentSubcategoryId ||
    selectedCategoryId !== currentCategoryId ||
    options.some((option) => option.value === currentSubcategoryId)
  ) {
    return options;
  }

  return [
    {
      value: currentSubcategoryId,
      label: `${getRelationName(
        selectedProduct?.subcategory,
        "Current Subcategory"
      )} (current)`,
    },
    ...options,
  ];
}

function buildProductUpdateChanges(productData, originalProduct) {
  if (!originalProduct) {
    return null;
  }

  const changes = {};
  const normalizedName = normalizeText(productData?.name);
  const normalizedDescription = normalizeText(productData?.description);
  const nextPrice = getFiniteNumber(productData?.price);
  const nextOriginalPrice = getOptionalOriginalPrice(
    productData?.originalPrice
  );
  const nextStock = getFiniteNumber(productData?.stock);
  const nextCategoryId = normalizeText(productData?.categoryId);
  const nextSubcategoryId = normalizeText(productData?.subcategoryId);
  const originalCategoryId = getRelationId(originalProduct.category);
  const originalSubcategoryId = getRelationId(originalProduct.subcategory);
  const nextTags = getTagsPayloadValue(productData?.tags);
  const originalTags = getTagsPayloadValue(originalProduct.tags);
  const replacementImages = getImageFiles(productData?.images);

  if (normalizedName !== normalizeText(originalProduct.name)) {
    changes.name = normalizedName;
  }

  if (normalizedDescription !== normalizeText(originalProduct.description)) {
    changes.description = normalizedDescription;
  }

  if (nextPrice !== getFiniteNumber(originalProduct.price)) {
    changes.price = nextPrice;
  }

  if (
    nextOriginalPrice !==
    getOptionalOriginalPrice(originalProduct.originalPrice)
  ) {
    changes.originalPrice = nextOriginalPrice === null ? 0 : nextOriginalPrice;
  }

  if (nextStock !== getFiniteNumber(originalProduct.stock)) {
    changes.stock = nextStock;
  }

  if (nextCategoryId !== originalCategoryId) {
    changes.categoryId = nextCategoryId;
    changes.subcategoryId = nextSubcategoryId;
  } else if (nextSubcategoryId !== originalSubcategoryId) {
    changes.subcategoryId = nextSubcategoryId;
  }

  if (
    getTagsComparisonValue(nextTags) !== getTagsComparisonValue(originalTags)
  ) {
    changes.tags = nextTags;
  }

  if (replacementImages.length > 0) {
    changes.images = replacementImages;
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

function buildProductCreatePayload(productData) {
  const payload = {
    name: normalizeText(productData.name),
    description: normalizeText(productData.description),
    price: productData.price,
    categoryId: normalizeText(productData.categoryId),
    subcategoryId: normalizeText(productData.subcategoryId),
    stock: productData.stock,
    tags: getTagsPayloadValue(productData.tags),
    images: getImageFiles(productData.images),
  };

  if (productData.originalPrice !== undefined) {
    payload.originalPrice = productData.originalPrice;
  }

  return payload;
}

function getSafeTotalPages(resultAction) {
  const totalPages = Number(resultAction.payload?.response?.data?.totalPages);

  return Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 1;
}

function PageFeedback({
  tone = "neutral",
  children,
  actionLabel = "",
  onAction,
}) {
  const toneClasses = FEEDBACK_TONES[tone] ?? FEEDBACK_TONES.neutral;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mb-6 flex min-w-0 flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${toneClasses.container}`}
    >
      <div
        className={`min-w-0 flex-1 wrap-break-word whitespace-pre-wrap text-sm ${toneClasses.text}`}
      >
        {children}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`${RETRY_BUTTON_CLASSES} ${toneClasses.button}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ProductFormModalController({
  control,
  mode,
  selectedProduct,
  ...modalProps
}) {
  const watchedProductForm = useWatch({ control });
  const hasMeaningfulChanges =
    mode === "edit" &&
    Boolean(buildProductUpdateChanges(watchedProductForm, selectedProduct));

  return (
    <ProductFormModal
      {...modalProps}
      control={control}
      mode={mode}
      hasMeaningfulChanges={hasMeaningfulChanges}
    />
  );
}

function ProductsPage() {
  const dispatch = useDispatch();
  const store = useStore();

  const products = useSelector(selectProducts);
  const productsTotal = useSelector(selectProductsTotal);
  const productsPage = useSelector(selectProductsPage);
  const productsTotalPages = useSelector(selectProductsTotalPages);
  const productsRequestedQueryKey = useSelector(
    selectProductsRequestedQueryKey
  );
  const productsLoadedQueryKey = useSelector(selectProductsLoadedQueryKey);
  const productsListStatus = useSelector(selectProductsListStatus);
  const productsListError = useSelector(selectProductsListError);
  const mutationRefresh = useSelector(selectProductsListRefreshRequirement);

  const productDetails = useSelector(selectProductDetails);
  const productDetailsStatus = useSelector(selectProductDetailsStatus);
  const productDetailsError = useSelector(selectProductDetailsError);

  const isCreatePending = useSelector(selectIsProductCreatePending);
  const createError = useSelector(selectProductCreateError);
  const createSuccessMessage = useSelector(selectProductCreateSuccessMessage);
  const isUpdatePending = useSelector(selectIsProductUpdatePending);
  const updateError = useSelector(selectProductUpdateError);
  const updateSuccessMessage = useSelector(selectProductUpdateSuccessMessage);
  const isApprovePending = useSelector(selectIsProductApprovePending);
  const approveError = useSelector(selectProductApproveError);
  const approveSuccessMessage = useSelector(selectProductApproveSuccessMessage);
  const isRejectPending = useSelector(selectIsProductRejectPending);
  const rejectError = useSelector(selectProductRejectError);
  const rejectSuccessMessage = useSelector(selectProductRejectSuccessMessage);
  const isTogglePending = useSelector(selectIsProductTogglePending);
  const toggleError = useSelector(selectProductToggleError);
  const toggleSuccessMessage = useSelector(selectProductToggleSuccessMessage);
  const isArchivePending = useSelector(selectIsProductArchivePending);
  const archiveError = useSelector(selectProductArchiveError);
  const archiveSuccessMessage = useSelector(selectProductArchiveSuccessMessage);
  const mutationTargetIds = useSelector(selectProductMutationTargetIds);

  const categories = useSelector(selectCategories);
  const categoriesListStatus = useSelector(selectCategoriesListStatus);
  const categoriesListError = useSelector(selectCategoriesListError);
  const isCategoriesListPending = useSelector(selectIsCategoriesListPending);

  const subcategories = useSelector(selectSubcategories);
  const subcategoriesListStatus = useSelector(selectSubcategoriesListStatus);
  const subcategoriesListError = useSelector(selectSubcategoriesListError);
  const isSubcategoriesListPending = useSelector(
    selectIsSubcategoriesListPending
  );

  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsProductId, setDetailsProductId] = useState("");
  const [approvingProduct, setApprovingProduct] = useState(null);
  const [rejectingProduct, setRejectingProduct] = useState(null);
  const [archivingProduct, setArchivingProduct] = useState(null);

  const isEditMode = selectedProduct !== null;
  const productFormSchema = isEditMode
    ? updateProductSchema
    : createProductSchema;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: getEmptyProductFormValues(),
  });

  const selectedCategoryId = normalizeText(
    useWatch({ control, name: "categoryId" })
  );

  const currentQueryArgs = useMemo(() => {
    const query = {
      page: currentPage,
      limit: PRODUCTS_PAGE_SIZE,
      search: committedSearch,
      approvalStatus: approvalFilter,
      isActive: availabilityFilter === "" ? undefined : availabilityFilter,
    };

    return {
      ...query,
      queryKey: createProductsQueryKey(query),
    };
  }, [approvalFilter, availabilityFilter, committedSearch, currentPage]);

  const latestQueryArgsRef = useRef(currentQueryArgs);

  const activeCategoryOptions = useMemo(
    () => buildCategoryOptions(categories),
    [categories]
  );
  const formCategoryOptions = useMemo(
    () => buildCategoryOptions(categories, selectedProduct),
    [categories, selectedProduct]
  );
  const subcategoryRecords = useMemo(
    () => buildSubcategoryRecords(subcategories),
    [subcategories]
  );
  const formSubcategoryOptions = useMemo(
    () =>
      buildSubcategoryOptions(
        subcategoryRecords,
        selectedCategoryId,
        selectedProduct
      ),
    [subcategoryRecords, selectedCategoryId, selectedProduct]
  );

  const hasUsableCategories = activeCategoryOptions.length > 0;
  const hasUsableSubcategories = subcategoryRecords.some((record) =>
    activeCategoryOptions.some(
      (categoryOption) => categoryOption.value === record.categoryId
    )
  );
  const areProductDependenciesUsable =
    hasUsableCategories && hasUsableSubcategories;
  const relationshipsLocked = isEditMode && !areProductDependenciesUsable;
  const isFormMutationPending = isEditMode ? isUpdatePending : isCreatePending;
  const formMutationError = isEditMode ? updateError : createError;
  const mutationSuccessMessage =
    archiveSuccessMessage ||
    rejectSuccessMessage ||
    approveSuccessMessage ||
    toggleSuccessMessage ||
    updateSuccessMessage ||
    createSuccessMessage;

  const currentQueryKey = currentQueryArgs.queryKey;
  const isCurrentQueryRequested = productsRequestedQueryKey === currentQueryKey;
  const isCurrentQueryLoaded = productsLoadedQueryKey === currentQueryKey;
  const isRequestedViewLoading =
    !isCurrentQueryLoaded &&
    (!isCurrentQueryRequested ||
      productsListStatus === REQUEST_STATUS.IDLE ||
      productsListStatus === REQUEST_STATUS.PENDING);
  const hasRequestedViewError =
    Boolean(productsListError) &&
    isCurrentQueryRequested &&
    !isCurrentQueryLoaded;
  const hasStaleProductsWarning =
    Boolean(productsListError) &&
    isCurrentQueryRequested &&
    isCurrentQueryLoaded;
  const hasActiveProductFilters =
    committedSearch.length > 0 ||
    approvalFilter !== "" ||
    availabilityFilter !== "";
  const isResultCountCurrent =
    isCurrentQueryLoaded && searchInput.trim() === committedSearch;
  const visibleProducts = isCurrentQueryLoaded ? products : [];
  const visibleCurrentPage = isCurrentQueryLoaded
    ? Math.min(Math.max(productsPage, 1), productsTotalPages)
    : currentPage;

  const categoriesUnavailable =
    Boolean(categoriesListError) && !hasUsableCategories;
  const subcategoriesUnavailable =
    Boolean(subcategoriesListError) && !hasUsableSubcategories;
  const hasStaleCategoriesWarning =
    Boolean(categoriesListError) && hasUsableCategories;
  const hasStaleSubcategoriesWarning =
    Boolean(subcategoriesListError) && hasUsableSubcategories;

  const dependencyLockMessage = categoriesUnavailable
    ? "Category options could not be loaded. Current classification values are locked, but other Product fields remain editable."
    : subcategoriesUnavailable
      ? "Subcategory options could not be loaded. Current classification values are locked, but other Product fields remain editable."
      : !hasUsableCategories || !hasUsableSubcategories
        ? "Classification options are not available. Current values are locked, but other Product fields remain editable."
        : "";

  useLayoutEffect(() => {
    latestQueryArgsRef.current = currentQueryArgs;
  }, [currentQueryArgs]);

  useEffect(() => {
    const normalizedSearch = searchInput.trim();

    if (normalizedSearch === committedSearch) {
      return undefined;
    }

    const searchTimerId = window.setTimeout(() => {
      setCurrentPage(1);
      setCommittedSearch(normalizedSearch);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(searchTimerId);
    };
  }, [committedSearch, searchInput]);

  useEffect(() => {
    let isActive = true;
    const requestPromise = dispatch(requestProductsListThunk(currentQueryArgs));
    const requestSequence =
      getPendingProductsListRequest(currentQueryArgs)?.sequence ?? 0;

    requestPromise.then((resultAction) => {
      const currentRefreshRequirement = selectProductsListRefreshRequirement(
        store.getState()
      );
      const isSupersededByRequiredRefresh =
        currentRefreshRequirement.afterSequence !== null &&
        requestSequence <= currentRefreshRequirement.afterSequence;

      if (
        !isActive ||
        isSupersededByRequiredRefresh ||
        !fetchProductsThunk.fulfilled.match(resultAction) ||
        resultAction.payload.queryKey !== latestQueryArgsRef.current.queryKey
      ) {
        return;
      }

      const safeTotalPages = getSafeTotalPages(resultAction);

      setCurrentPage((page) =>
        page === currentQueryArgs.page && page > safeTotalPages
          ? safeTotalPages
          : page
      );
    });

    return () => {
      isActive = false;
    };
  }, [currentQueryArgs, dispatch, store]);

  useEffect(() => {
    if (mutationRefresh.afterSequence === null) {
      return undefined;
    }

    let isActive = true;
    const refreshVersion = mutationRefresh.version;

    function ownsRefreshRequirement() {
      const currentRequirement = selectProductsListRefreshRequirement(
        store.getState()
      );

      return (
        currentRequirement.afterSequence !== null &&
        currentRequirement.version === refreshVersion
      );
    }

    async function refreshRequestedQuery() {
      let resultAction = null;

      while (isActive) {
        if (
          !ownsRefreshRequirement() ||
          currentQueryArgs.queryKey !== latestQueryArgsRef.current.queryKey
        ) {
          return;
        }

        const pendingRequest = getPendingProductsListRequest(currentQueryArgs);

        if (!pendingRequest) {
          resultAction = await dispatch(
            requestProductsListThunk({
              ...currentQueryArgs,
              force: true,
            })
          );
          break;
        }

        resultAction = await pendingRequest.promise;

        if (!isActive) {
          return;
        }

        if (pendingRequest.sequence > mutationRefresh.afterSequence) {
          break;
        }
      }

      if (
        !isActive ||
        currentQueryArgs.queryKey !== latestQueryArgsRef.current.queryKey ||
        !ownsRefreshRequirement()
      ) {
        return;
      }

      dispatch(clearProductsListRefreshRequirement(refreshVersion));

      if (
        !fetchProductsThunk.fulfilled.match(resultAction) ||
        resultAction.payload.queryKey !== currentQueryArgs.queryKey
      ) {
        return;
      }

      const safeTotalPages = getSafeTotalPages(resultAction);

      setCurrentPage((page) =>
        page === currentQueryArgs.page && page > safeTotalPages
          ? safeTotalPages
          : page
      );
    }

    void refreshRequestedQuery();

    return () => {
      isActive = false;
    };
  }, [currentQueryArgs, dispatch, mutationRefresh, store]);

  useEffect(() => {
    if (categoriesListStatus === REQUEST_STATUS.IDLE) {
      dispatch(fetchCategoriesThunk());
    }

    if (subcategoriesListStatus === REQUEST_STATUS.IDLE) {
      dispatch(fetchSubcategoriesThunk());
    }
  }, [categoriesListStatus, dispatch, subcategoriesListStatus]);

  useEffect(() => {
    return () => {
      dispatch(clearProductDetails());
      dispatch(clearProductMutationRequestFeedback());
    };
  }, [dispatch]);

  function clearAllModalSelections() {
    setIsProductFormOpen(false);
    setSelectedProduct(null);
    setDetailsProductId("");
    setApprovingProduct(null);
    setRejectingProduct(null);
    setArchivingProduct(null);
    dispatch(clearProductDetails());
  }

  function handleApprovalFilterChange(value) {
    setApprovalFilter(normalizeText(value));
    setCurrentPage(1);
  }

  function handleAvailabilityFilterChange(value) {
    setAvailabilityFilter(value === true || value === false ? value : "");
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > productsTotalPages || !isCurrentQueryLoaded) {
      return;
    }

    setCurrentPage(page);
  }

  function handleRetryProducts() {
    scheduleProductsRefresh();
  }

  function handleRetryCategories() {
    dispatch(fetchCategoriesThunk({ force: true }));
  }

  function handleRetrySubcategories() {
    dispatch(fetchSubcategoriesThunk({ force: true }));
  }

  function scheduleProductsRefresh() {
    dispatch(requestProductsListRefresh(getProductsListRequestSequence()));
  }

  function handleOpenCreateModal() {
    if (!areProductDependenciesUsable) {
      return;
    }

    clearAllModalSelections();
    dispatch(clearProductMutationRequestFeedback());
    clearErrors();
    reset(getEmptyProductFormValues());
    setIsProductFormOpen(true);
  }

  function handleOpenEditModal(product) {
    clearAllModalSelections();
    dispatch(clearProductMutationRequestFeedback());
    clearErrors();
    setSelectedProduct(product);
    reset(getProductEditFormValues(product));
    setIsProductFormOpen(true);
  }

  function handleCloseProductForm() {
    if (isFormMutationPending) {
      return;
    }

    dispatch(clearCreateProductRequestFeedback());
    dispatch(clearUpdateProductRequestFeedback());
    clearErrors();
    setIsProductFormOpen(false);
    setSelectedProduct(null);
    reset(getEmptyProductFormValues());
  }

  async function handleValidProductSubmit(productData) {
    if (isFormMutationPending) {
      return;
    }

    const sessionGeneration = selectAdminSessionGeneration(store.getState());

    if (isEditMode) {
      const changes = buildProductUpdateChanges(productData, selectedProduct);

      if (!changes) {
        reset(getProductEditFormValues(selectedProduct));
        return;
      }

      const resultAction = await dispatch(
        updateProductThunk({
          productId: selectedProduct._id,
          changes,
        })
      );

      if (
        !updateProductThunk.fulfilled.match(resultAction) ||
        selectAdminSessionGeneration(store.getState()) !== sessionGeneration
      ) {
        return;
      }
    } else {
      const resultAction = await dispatch(
        createProductThunk(buildProductCreatePayload(productData))
      );

      if (
        !createProductThunk.fulfilled.match(resultAction) ||
        selectAdminSessionGeneration(store.getState()) !== sessionGeneration
      ) {
        return;
      }
    }

    setIsProductFormOpen(false);
    setSelectedProduct(null);
    clearErrors();
    reset(getEmptyProductFormValues());
    scheduleProductsRefresh();
  }

  function handleProductFormSubmit(event) {
    const submitProductForm = handleSubmit(handleValidProductSubmit);

    return submitProductForm(event);
  }

  function handleOpenDetails(product) {
    const productId = normalizeText(product?._id);

    if (!productId) {
      return;
    }

    clearAllModalSelections();
    setDetailsProductId(productId);
    dispatch(fetchProductDetailsThunk(productId));
  }

  function handleCloseDetails() {
    setDetailsProductId("");
    dispatch(clearProductDetails());
  }

  function handleRetryDetails() {
    if (detailsProductId) {
      dispatch(fetchProductDetailsThunk(detailsProductId));
    }
  }

  function handleOpenApproveModal(product) {
    clearAllModalSelections();
    dispatch(clearProductMutationRequestFeedback());
    setApprovingProduct(product);
  }

  function handleCloseApproveModal() {
    if (isApprovePending) {
      return;
    }

    dispatch(clearApproveProductRequestFeedback());
    setApprovingProduct(null);
  }

  async function handleConfirmApprove() {
    if (!approvingProduct || isApprovePending) {
      return;
    }

    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const resultAction = await dispatch(
      approveProductThunk(approvingProduct._id)
    );

    if (
      !approveProductThunk.fulfilled.match(resultAction) ||
      selectAdminSessionGeneration(store.getState()) !== sessionGeneration
    ) {
      return;
    }

    setApprovingProduct(null);
    scheduleProductsRefresh();
  }

  function handleOpenRejectModal(product) {
    clearAllModalSelections();
    dispatch(clearProductMutationRequestFeedback());
    setRejectingProduct(product);
  }

  function handleCloseRejectModal() {
    if (isRejectPending) {
      return;
    }

    dispatch(clearRejectProductRequestFeedback());
    setRejectingProduct(null);
  }

  async function handleConfirmReject(rejectedReason) {
    if (!rejectingProduct || isRejectPending) {
      return;
    }

    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const resultAction = await dispatch(
      rejectProductThunk({
        productId: rejectingProduct._id,
        rejectedReason,
      })
    );

    if (
      !rejectProductThunk.fulfilled.match(resultAction) ||
      selectAdminSessionGeneration(store.getState()) !== sessionGeneration
    ) {
      return;
    }

    setRejectingProduct(null);
    scheduleProductsRefresh();
  }

  async function handleToggleAvailability(product) {
    if (
      normalizeText(product?.approvalStatus).toLowerCase() !== "approved" ||
      product?.isDeleted === true ||
      isTogglePending
    ) {
      return;
    }

    dispatch(clearToggleProductRequestFeedback());

    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const resultAction = await dispatch(toggleProductStatusThunk(product._id));

    if (
      !toggleProductStatusThunk.fulfilled.match(resultAction) ||
      selectAdminSessionGeneration(store.getState()) !== sessionGeneration
    ) {
      return;
    }

    scheduleProductsRefresh();
  }

  function handleOpenArchiveModal(product) {
    clearAllModalSelections();
    dispatch(clearProductMutationRequestFeedback());
    setArchivingProduct(product);
  }

  function handleCloseArchiveModal() {
    if (isArchivePending) {
      return;
    }

    dispatch(clearArchiveProductRequestFeedback());
    setArchivingProduct(null);
  }

  async function handleConfirmArchive() {
    if (!archivingProduct || isArchivePending) {
      return;
    }

    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const resultAction = await dispatch(
      archiveProductThunk(archivingProduct._id)
    );

    if (
      !archiveProductThunk.fulfilled.match(resultAction) ||
      selectAdminSessionGeneration(store.getState()) !== sessionGeneration
    ) {
      return;
    }

    setArchivingProduct(null);
    scheduleProductsRefresh();
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <PageBreadcrumb
        pageTitle="Products"
        description="Manage catalog details, moderation, availability, and Product lifecycle."
      />

      <ProductsToolbar
        searchQuery={searchInput}
        approvalFilter={approvalFilter}
        availabilityFilter={availabilityFilter}
        resultCount={productsTotal}
        isResultCountCurrent={isResultCountCurrent}
        isAddDisabled={!areProductDependenciesUsable}
        onSearchChange={setSearchInput}
        onApprovalFilterChange={handleApprovalFilterChange}
        onAvailabilityFilterChange={handleAvailabilityFilterChange}
        onAdd={handleOpenCreateModal}
      />

      {mutationSuccessMessage && (
        <PageFeedback
          tone="success"
          actionLabel="Dismiss"
          onAction={() => dispatch(clearProductMutationRequestFeedback())}
        >
          {mutationSuccessMessage}
        </PageFeedback>
      )}

      {toggleError && (
        <PageFeedback
          tone="error"
          actionLabel="Dismiss"
          onAction={() => dispatch(clearToggleProductRequestFeedback())}
        >
          {toggleError}
        </PageFeedback>
      )}

      {hasRequestedViewError && (
        <PageFeedback
          tone="error"
          actionLabel="Try again"
          onAction={handleRetryProducts}
        >
          <p>
            Products for the requested search and filters could not be loaded.
          </p>
          <p className="mt-1 text-xs">{productsListError}</p>
        </PageFeedback>
      )}

      {hasStaleProductsWarning && (
        <PageFeedback
          tone="warning"
          actionLabel="Try again"
          onAction={handleRetryProducts}
        >
          <p>
            Products could not be refreshed. Previously loaded data is shown.
          </p>
          <p className="mt-1 text-xs">{productsListError}</p>
        </PageFeedback>
      )}

      {categoriesUnavailable && (
        <PageFeedback
          tone="error"
          actionLabel="Retry Categories"
          onAction={handleRetryCategories}
        >
          <p>{categoriesListError}</p>
          <p className="mt-1 text-xs">
            Add Product is unavailable. Existing Products can still be viewed,
            moderated, archived, or edited outside their classification.
          </p>
        </PageFeedback>
      )}

      {hasStaleCategoriesWarning && (
        <PageFeedback
          tone="warning"
          actionLabel="Retry Categories"
          onAction={handleRetryCategories}
        >
          <p>Previously loaded Category options remain available.</p>
          <p className="mt-1 text-xs">{categoriesListError}</p>
        </PageFeedback>
      )}

      {subcategoriesUnavailable && (
        <PageFeedback
          tone="error"
          actionLabel="Retry Subcategories"
          onAction={handleRetrySubcategories}
        >
          <p>{subcategoriesListError}</p>
          <p className="mt-1 text-xs">
            Add Product is unavailable. Existing Products can still be viewed,
            moderated, archived, or edited outside their classification.
          </p>
        </PageFeedback>
      )}

      {hasStaleSubcategoriesWarning && (
        <PageFeedback
          tone="warning"
          actionLabel="Retry Subcategories"
          onAction={handleRetrySubcategories}
        >
          <p>Previously loaded Subcategory options remain available.</p>
          <p className="mt-1 text-xs">{subcategoriesListError}</p>
        </PageFeedback>
      )}

      {categoriesListStatus === REQUEST_STATUS.SUCCEEDED &&
        !hasUsableCategories && (
          <PageFeedback tone="neutral">
            Add a Category before creating a Product. Existing Products remain
            available for other management actions.
          </PageFeedback>
        )}

      {subcategoriesListStatus === REQUEST_STATUS.SUCCEEDED &&
        !hasUsableSubcategories && (
          <PageFeedback tone="neutral">
            Add a Subcategory before creating a Product. Existing Products
            remain available for other management actions.
          </PageFeedback>
        )}

      {!hasRequestedViewError && (
        <ProductsTable
          products={visibleProducts}
          isLoading={isRequestedViewLoading}
          hasActiveFilters={hasActiveProductFilters}
          onView={handleOpenDetails}
          onEdit={handleOpenEditModal}
          onApprove={handleOpenApproveModal}
          onReject={handleOpenRejectModal}
          onToggleAvailability={handleToggleAvailability}
          onArchive={handleOpenArchiveModal}
          pendingActions={{
            approve: isApprovePending,
            reject: isRejectPending,
            toggle: isTogglePending,
            archive: isArchivePending,
          }}
          mutationTargetIds={mutationTargetIds}
          currentPage={visibleCurrentPage}
          totalPages={productsTotalPages}
          totalItems={productsTotal}
          pageSize={PRODUCTS_PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}

      {isProductFormOpen && (
        <ProductFormModalController
          key={selectedProduct?._id ?? "create"}
          isOpen
          mode={isEditMode ? "edit" : "create"}
          selectedProduct={selectedProduct}
          onClose={handleCloseProductForm}
          onSubmit={handleProductFormSubmit}
          register={register}
          control={control}
          setValue={setValue}
          clearErrors={clearErrors}
          categoryOptions={formCategoryOptions}
          subcategoryOptions={formSubcategoryOptions}
          existingImages={selectedProduct?.images ?? []}
          errors={errors}
          submitError={formMutationError ?? ""}
          isSubmitting={isFormMutationPending}
          relationshipsLocked={relationshipsLocked}
          dependencyMessage={dependencyLockMessage}
          isCategoryLoading={isCategoriesListPending && !hasUsableCategories}
          isSubcategoryLoading={
            isSubcategoriesListPending && !hasUsableSubcategories
          }
        />
      )}

      {detailsProductId && (
        <ProductDetailsModal
          isOpen
          product={productDetails}
          error={productDetailsError ?? ""}
          isLoading={
            productDetailsStatus === REQUEST_STATUS.IDLE ||
            productDetailsStatus === REQUEST_STATUS.PENDING
          }
          onClose={handleCloseDetails}
          onRetry={handleRetryDetails}
        />
      )}

      {approvingProduct && (
        <ProductApproveModal
          isOpen
          product={approvingProduct}
          error={approveError ?? ""}
          isApproving={isApprovePending}
          onClose={handleCloseApproveModal}
          onConfirm={handleConfirmApprove}
        />
      )}

      {rejectingProduct && (
        <ProductRejectModal
          isOpen
          product={rejectingProduct}
          error={rejectError ?? ""}
          isRejecting={isRejectPending}
          onClose={handleCloseRejectModal}
          onConfirm={handleConfirmReject}
        />
      )}

      {archivingProduct && (
        <ProductArchiveModal
          isOpen
          product={archivingProduct}
          error={archiveError ?? ""}
          isArchiving={isArchivePending}
          onClose={handleCloseArchiveModal}
          onConfirm={handleConfirmArchive}
        />
      )}
    </div>
  );
}

export default ProductsPage;

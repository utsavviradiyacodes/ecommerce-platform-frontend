import { useEffect, useMemo, useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useDispatch, useSelector } from "react-redux";

import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";
import SubcategoryDeleteModal from "../../components/subcategories/SubcategoryDeleteModal.jsx";
import SubcategoryFormModal from "../../components/subcategories/SubcategoryFormModal.jsx";
import SubcategoriesTable from "../../components/subcategories/SubcategoriesTable.jsx";
import SubcategoriesToolbar from "../../components/subcategories/SubcategoriesToolbar.jsx";

import {
  clearCreateSubcategoryRequestFeedback,
  clearDeleteSubcategoryRequestFeedback,
  clearUpdateSubcategoryRequestFeedback,
  createSubcategoryThunk,
  deleteSubcategoryThunk,
  fetchSubcategoriesThunk,
  resetSubcategoryMutationRequestStates,
  selectIsSubcategoryCreatePending,
  selectIsSubcategoryDeletePending,
  selectIsSubcategoryUpdatePending,
  selectSubcategories,
  selectSubcategoriesListError,
  selectSubcategoriesListStatus,
  selectSubcategoryCreateError,
  selectSubcategoryCreateSuccessMessage,
  selectSubcategoryDeleteError,
  selectSubcategoryDeleteSuccessMessage,
  selectSubcategoryUpdateError,
  selectSubcategoryUpdateSuccessMessage,
  updateSubcategoryThunk,
} from "../../features/subcategories/subcategoriesSlice.js";

import {
  fetchCategoriesThunk,
  selectCategories,
  selectCategoriesListError,
  selectCategoriesListStatus,
  selectIsCategoriesListPending,
} from "../../features/categories/categoriesSlice.js";

import {
  buildSubcategoryUpdatePayload,
  getSubcategoryEditFormValues,
} from "../../features/subcategories/subcategoryFormUtils.js";
import {
  buildSubcategoryCategoryOptions,
  buildSubcategoryFormCategoryOptions,
  filterSubcategories,
  paginateSubcategories,
} from "../../features/subcategories/subcategoryPageUtils.js";
import { subcategorySchema } from "../../schemas/subcategories/subcategorySchema.js";
import { REQUEST_STATUS } from "../../utils/redux/requestState.js";

const SUBCATEGORY_PAGE_SIZE = 5;

const RETRY_BUTTON_CLASSES =
  "inline-flex shrink-0 items-center justify-center rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-theme-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-transparent";

function SubcategoriesPage() {
  const dispatch = useDispatch();

  const subcategories = useSelector(selectSubcategories);
  const subcategoriesListError = useSelector(selectSubcategoriesListError);
  const subcategoriesListStatus = useSelector(selectSubcategoriesListStatus);

  const categories = useSelector(selectCategories);
  const isCategoriesListPending = useSelector(selectIsCategoriesListPending);
  const categoriesListError = useSelector(selectCategoriesListError);
  const categoriesListStatus = useSelector(selectCategoriesListStatus);

  const isCreatePending = useSelector(selectIsSubcategoryCreatePending);
  const createError = useSelector(selectSubcategoryCreateError);
  const createSuccessMessage = useSelector(
    selectSubcategoryCreateSuccessMessage
  );

  const isUpdatePending = useSelector(selectIsSubcategoryUpdatePending);
  const updateError = useSelector(selectSubcategoryUpdateError);
  const updateSuccessMessage = useSelector(
    selectSubcategoryUpdateSuccessMessage
  );

  const isDeletePending = useSelector(selectIsSubcategoryDeletePending);
  const deleteError = useSelector(selectSubcategoryDeleteError);
  const deleteSuccessMessage = useSelector(
    selectSubcategoryDeleteSuccessMessage
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [replacementResetKey, setReplacementResetKey] = useState(0);

  const [deletingSubcategory, setDeletingSubcategory] = useState(null);

  const isEditMode = selectedSubcategory !== null;
  const isFormMutationPending = isEditMode ? isUpdatePending : isCreatePending;
  const formMutationError = isEditMode ? updateError : createError;

  const mutationSuccessMessage =
    deleteSuccessMessage || updateSuccessMessage || createSuccessMessage;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: "",
      categoryId: "",
      image: null,
    },
  });

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedCategoryId !== "";

  const filteredSubcategories = useMemo(() => {
    return filterSubcategories(
      subcategories,
      searchQuery,
      selectedCategoryId
    );
  }, [subcategories, searchQuery, selectedCategoryId]);

  const {
    currentPage: visibleCurrentPage,
    totalPages,
    items: paginatedSubcategories,
  } = useMemo(() => {
    return paginateSubcategories(
      filteredSubcategories,
      currentPage,
      SUBCATEGORY_PAGE_SIZE
    );
  }, [filteredSubcategories, currentPage]);

  const categoryOptions = useMemo(() => {
    return buildSubcategoryCategoryOptions(categories);
  }, [categories]);

  const formCategoryOptions = useMemo(() => {
    return buildSubcategoryFormCategoryOptions(
      categoryOptions,
      selectedSubcategory
    );
  }, [categoryOptions, selectedSubcategory]);

  const hasSubcategories = subcategories.length > 0;
  const hasCategories = categoryOptions.length > 0;

  const isInitialSubcategoriesLoading =
    !hasSubcategories &&
    (subcategoriesListStatus === REQUEST_STATUS.IDLE ||
      subcategoriesListStatus === REQUEST_STATUS.PENDING);
  const isInitialCategoriesLoading =
    !hasCategories &&
    (categoriesListStatus === REQUEST_STATUS.IDLE ||
      categoriesListStatus === REQUEST_STATUS.PENDING);

  const isSubcategoriesUnavailable =
    Boolean(subcategoriesListError) && !hasSubcategories;
  const isCategoriesUnavailable =
    Boolean(categoriesListError) && !hasCategories;

  const hasStaleSubcategoriesWarning =
    Boolean(subcategoriesListError) && hasSubcategories;
  const hasStaleCategoriesWarning =
    Boolean(categoriesListError) && hasCategories;

  const categoryDependencyMessage = hasCategories
    ? ""
    : isInitialCategoriesLoading
      ? "Category options are loading. You can still update the name or image."
      : isCategoriesUnavailable
        ? "Category options could not be loaded. You can still update the name or image."
        : "Create a category before changing the parent category. You can still update the name or image.";

  useEffect(() => {
    dispatch(fetchSubcategoriesThunk());
    dispatch(fetchCategoriesThunk());

    return () => {
      dispatch(resetSubcategoryMutationRequestStates());
    };
  }, [dispatch]);

  function clearSubcategoryMutationFeedback() {
    dispatch(clearCreateSubcategoryRequestFeedback());
    dispatch(clearUpdateSubcategoryRequestFeedback());
    dispatch(clearDeleteSubcategoryRequestFeedback());
  }

  function handleSearchChange(value) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleCategoryChange(value) {
    setSelectedCategoryId(value);
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  }

  function handleRetrySubcategories() {
    dispatch(fetchSubcategoriesThunk());
  }

  function handleRetryCategories() {
    dispatch(fetchCategoriesThunk());
  }

  function handleOpenCreateModal() {
    if (!hasCategories) {
      return;
    }

    clearSubcategoryMutationFeedback();
    setSelectedSubcategory(null);
    setReplacementResetKey(0);

    reset({
      name: "",
      categoryId: "",
      image: null,
    });

    setIsSubcategoryModalOpen(true);
  }

  function handleOpenEditModal(subcategory) {
    clearSubcategoryMutationFeedback();
    setSelectedSubcategory(subcategory);
    setReplacementResetKey(0);
    reset(getSubcategoryEditFormValues(subcategory));
    setIsSubcategoryModalOpen(true);
  }

  function handleCloseSubcategoryModal() {
    if (isFormMutationPending) {
      return;
    }

    setIsSubcategoryModalOpen(false);
    setSelectedSubcategory(null);
    setReplacementResetKey(0);

    reset({
      name: "",
      categoryId: "",
      image: null,
    });
  }

  async function handleValidSubcategorySubmit(subcategoryData) {
    if (isFormMutationPending) {
      return;
    }

    let mutationThunk;
    let mutationPayload;

    if (isEditMode) {
      mutationThunk = updateSubcategoryThunk;
      mutationPayload = buildSubcategoryUpdatePayload(
        subcategoryData,
        selectedSubcategory
      );

      if (!mutationPayload) {
        reset(getSubcategoryEditFormValues(selectedSubcategory));
        setReplacementResetKey((currentKey) => currentKey + 1);
        return;
      }
    } else {
      mutationThunk = createSubcategoryThunk;
      mutationPayload = subcategoryData;
    }

    const resultAction = await dispatch(mutationThunk(mutationPayload));

    if (!mutationThunk.fulfilled.match(resultAction)) {
      return;
    }

    setIsSubcategoryModalOpen(false);
    setSelectedSubcategory(null);
    setReplacementResetKey(0);

    reset({
      name: "",
      categoryId: "",
      image: null,
    });

    dispatch(fetchSubcategoriesThunk({ force: true }));
  }

  function handleOpenDeleteModal(subcategory) {
    clearSubcategoryMutationFeedback();
    setDeletingSubcategory(subcategory);
  }

  function handleCloseDeleteModal() {
    if (isDeletePending) {
      return;
    }

    setDeletingSubcategory(null);
  }

  async function handleConfirmDelete() {
    if (!deletingSubcategory || isDeletePending) {
      return;
    }

    const resultAction = await dispatch(
      deleteSubcategoryThunk(deletingSubcategory._id)
    );

    if (!deleteSubcategoryThunk.fulfilled.match(resultAction)) {
      return;
    }

    setDeletingSubcategory(null);
    dispatch(fetchSubcategoriesThunk({ force: true }));
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <PageBreadcrumb
        pageTitle="Subcategories"
        description="Organize products into focused groups under each parent category."
      />

      <SubcategoriesToolbar
        searchQuery={searchQuery}
        selectedCategoryId={selectedCategoryId}
        categoryOptions={categoryOptions}
        resultCount={filteredSubcategories.length}
        isSearchDisabled={!hasSubcategories}
        isCategoryFilterDisabled={!hasCategories || !hasSubcategories}
        isCategoryFilterLoading={isCategoriesListPending}
        isAddDisabled={!hasCategories}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onAdd={handleOpenCreateModal}
      />

      {mutationSuccessMessage && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-success-500/30 dark:bg-success-500/10">
          <p className="text-sm text-success-700 dark:text-success-400">
            {mutationSuccessMessage}
          </p>

          <button
            type="button"
            onClick={clearSubcategoryMutationFeedback}
            className={`${RETRY_BUTTON_CLASSES} border-success-300 text-success-700 hover:bg-success-100 focus-visible:outline-success-500 dark:border-success-500/40 dark:text-success-400 dark:hover:bg-success-500/10`}
          >
            Dismiss
          </button>
        </div>
      )}

      {isSubcategoriesUnavailable && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-error-500/30 dark:bg-error-500/10">
          <p className="text-sm text-error-700 dark:text-error-400">
            {subcategoriesListError}
          </p>

          <button
            type="button"
            onClick={handleRetrySubcategories}
            className={`${RETRY_BUTTON_CLASSES} border-error-300 text-error-700 hover:bg-error-100 focus-visible:outline-error-500 dark:border-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10`}
          >
            Try again
          </button>
        </div>
      )}

      {hasStaleSubcategoriesWarning && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-warning-500/30 dark:bg-warning-500/10">
          <div className="text-sm text-warning-700 dark:text-warning-400">
            <p>
              Subcategories could not be refreshed. Displaying previously
              loaded data.
            </p>
            <p className="mt-1 text-xs">{subcategoriesListError}</p>
          </div>

          <button
            type="button"
            onClick={handleRetrySubcategories}
            className={`${RETRY_BUTTON_CLASSES} border-warning-300 text-warning-700 hover:bg-warning-100 focus-visible:outline-warning-500 dark:border-warning-500/40 dark:text-warning-400 dark:hover:bg-warning-500/10`}
          >
            Try again
          </button>
        </div>
      )}

      {isCategoriesUnavailable && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-error-500/30 dark:bg-error-500/10">
          <div className="text-sm text-error-700 dark:text-error-400">
            <p>{categoriesListError}</p>
            <p className="mt-1 text-xs">
              Category options could not be loaded. You can still update a
              subcategory&apos;s name or image.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRetryCategories}
            className={`${RETRY_BUTTON_CLASSES} border-error-300 text-error-700 hover:bg-error-100 focus-visible:outline-error-500 dark:border-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10`}
          >
            Try again
          </button>
        </div>
      )}

      {hasStaleCategoriesWarning && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-warning-500/30 dark:bg-warning-500/10">
          <div className="text-sm text-warning-700 dark:text-warning-400">
            <p>
              Categories could not be refreshed. Previously loaded category
              options are still available.
            </p>
            <p className="mt-1 text-xs">{categoriesListError}</p>
          </div>

          <button
            type="button"
            onClick={handleRetryCategories}
            className={`${RETRY_BUTTON_CLASSES} border-warning-300 text-warning-700 hover:bg-warning-100 focus-visible:outline-warning-500 dark:border-warning-500/40 dark:text-warning-400 dark:hover:bg-warning-500/10`}
          >
            Try again
          </button>
        </div>
      )}

      {categoriesListStatus === REQUEST_STATUS.SUCCEEDED && !hasCategories && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-white/2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add a category before creating a subcategory. Existing
            subcategories can still be edited or deleted.
          </p>
        </div>
      )}

      {!isSubcategoriesUnavailable && (
        <SubcategoriesTable
          subcategories={paginatedSubcategories}
          isLoading={isInitialSubcategoriesLoading}
          hasActiveFilters={hasActiveFilters}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          currentPage={visibleCurrentPage}
          totalPages={totalPages}
          totalItems={filteredSubcategories.length}
          pageSize={SUBCATEGORY_PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}

      {isSubcategoryModalOpen && (
        <SubcategoryFormModal
          key={`${selectedSubcategory?._id ?? "create"}-${replacementResetKey}`}
          isOpen
          mode={isEditMode ? "edit" : "create"}
          onClose={handleCloseSubcategoryModal}
          onSubmit={handleSubmit(handleValidSubcategorySubmit)}
          nameInputProps={register("name")}
          imageInputProps={register("image")}
          control={control}
          originalSubcategory={selectedSubcategory}
          categoryOptions={formCategoryOptions}
          previewUrl={selectedSubcategory?.image ?? ""}
          nameError={errors.name?.message ?? ""}
          categoryError={errors.categoryId?.message ?? ""}
          imageError={errors.image?.message ?? ""}
          submitError={formMutationError ?? ""}
          categoryDependencyMessage={categoryDependencyMessage}
          isCategorySelectionDisabled={!hasCategories}
          isCategorySelectionLoading={isCategoriesListPending}
          isSubmitting={isFormMutationPending}
        />
      )}

      {deletingSubcategory && (
        <SubcategoryDeleteModal
          isOpen
          subcategory={deletingSubcategory}
          error={deleteError ?? ""}
          isDeleting={isDeletePending}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

export default SubcategoriesPage;

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { zodResolver } from "@hookform/resolvers/zod";

import CategoriesTable from "../../components/categories/CategoriesTable.jsx";
import CategoriesToolbar from "../../components/categories/CategoriesToolbar.jsx";
import CategoryDeleteModal from "../../components/categories/CategoryDeleteModal.jsx";
import CategoryFormModal from "../../components/categories/CategoryFormModal.jsx";
import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";

import {
  clearCreateCategoryRequestFeedback,
  clearDeleteCategoryRequestFeedback,
  clearUpdateCategoryRequestFeedback,
  createCategoryThunk,
  deleteCategoryThunk,
  fetchCategoriesThunk,
  resetCategoryMutationRequestStates,
  selectCategories,
  selectCategoriesListError,
  selectCategoriesListStatus,
  selectCategoryCreateError,
  selectCategoryCreateSuccessMessage,
  selectCategoryDeleteError,
  selectCategoryDeleteSuccessMessage,
  selectCategoryUpdateError,
  selectCategoryUpdateSuccessMessage,
  selectIsCategoryCreatePending,
  selectIsCategoryDeletePending,
  selectIsCategoryUpdatePending,
  updateCategoryThunk,
} from "../../features/categories/categoriesSlice.js";

import { categorySchema } from "../../schemas/categories/categorySchema.js";
import { REQUEST_STATUS } from "../../utils/redux/requestState.js";

const CATEGORY_PAGE_SIZE = 5;

const RETRY_BUTTON_CLASSES =
  "inline-flex shrink-0 items-center justify-center rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-theme-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-transparent";

function normalizeCategoryName(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getCategoryEditFormValues(category) {
  return {
    name: normalizeCategoryName(category?.name),
    image: null,
  };
}

function buildCategoryUpdatePayload(categoryData, originalCategory) {
  const normalizedName = normalizeCategoryName(categoryData.name);
  const originalName = normalizeCategoryName(originalCategory?.name);

  const updatePayload = {
    categoryId: originalCategory._id,
  };

  if (normalizedName !== originalName) {
    updatePayload.name = normalizedName;
  }

  if (categoryData.image) {
    updatePayload.image = categoryData.image;
  }

  return Object.keys(updatePayload).length > 1 ? updatePayload : null;
}

function filterCategories(categories, searchQuery) {
  const normalizedQuery = normalizeCategoryName(searchQuery).toLowerCase();

  if (!normalizedQuery) {
    return categories;
  }

  return categories.filter((category) =>
    normalizeCategoryName(category?.name)
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

function paginateCategories(categories, requestedPage, pageSize) {
  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    currentPage,
    totalPages,
    items: categories.slice(startIndex, startIndex + pageSize),
  };
}

function CategoriesPage() {
  const dispatch = useDispatch();

  const categories = useSelector(selectCategories);
  const categoriesListStatus = useSelector(selectCategoriesListStatus);
  const categoriesListError = useSelector(selectCategoriesListError);

  const isCreatePending = useSelector(selectIsCategoryCreatePending);
  const createError = useSelector(selectCategoryCreateError);
  const createSuccessMessage = useSelector(selectCategoryCreateSuccessMessage);

  const isUpdatePending = useSelector(selectIsCategoryUpdatePending);
  const updateError = useSelector(selectCategoryUpdateError);
  const updateSuccessMessage = useSelector(selectCategoryUpdateSuccessMessage);

  const isDeletePending = useSelector(selectIsCategoryDeletePending);
  const deleteError = useSelector(selectCategoryDeleteError);
  const deleteSuccessMessage = useSelector(selectCategoryDeleteSuccessMessage);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [deletingCategory, setDeletingCategory] = useState(null);

  const isEditMode = selectedCategory !== null;
  const isFormMutationPending = isEditMode
    ? isUpdatePending
    : isCreatePending;
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
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      image: null,
    },
  });

  const hasSearchQuery = searchQuery.trim().length > 0;

  const filteredCategories = useMemo(() => {
    return filterCategories(categories, searchQuery);
  }, [categories, searchQuery]);

  const {
    currentPage: visibleCurrentPage,
    totalPages,
    items: paginatedCategories,
  } = useMemo(() => {
    return paginateCategories(
      filteredCategories,
      currentPage,
      CATEGORY_PAGE_SIZE
    );
  }, [filteredCategories, currentPage]);

  const hasCategories = categories.length > 0;

  const isInitialCategoriesLoading =
    !hasCategories &&
    (categoriesListStatus === REQUEST_STATUS.IDLE ||
      categoriesListStatus === REQUEST_STATUS.PENDING);

  const isCategoriesUnavailable =
    Boolean(categoriesListError) && !hasCategories;

  const hasStaleCategoriesWarning =
    Boolean(categoriesListError) && hasCategories;

  useEffect(() => {
    dispatch(fetchCategoriesThunk());

    return () => {
      dispatch(resetCategoryMutationRequestStates());
    };
  }, [dispatch]);

  function clearCategoryFormFeedback() {
    dispatch(clearCreateCategoryRequestFeedback());
    dispatch(clearUpdateCategoryRequestFeedback());
  }

  function clearCategoryMutationFeedback() {
    clearCategoryFormFeedback();
    dispatch(clearDeleteCategoryRequestFeedback());
  }

  function handleRetry() {
    dispatch(fetchCategoriesThunk({ force: true }));
  }

  function handleSearchChange(value) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  }

  function handleOpenCreateModal() {
    clearCategoryMutationFeedback();
    setSelectedCategory(null);

    reset({
      name: "",
      image: null,
    });

    setIsCategoryModalOpen(true);
  }

  function handleOpenEditModal(category) {
    clearCategoryMutationFeedback();
    setSelectedCategory(category);
    reset(getCategoryEditFormValues(category));
    setIsCategoryModalOpen(true);
  }

  function handleCloseCategoryModal() {
    if (isFormMutationPending) {
      return;
    }

    clearCategoryFormFeedback();
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);

    reset({
      name: "",
      image: null,
    });
  }

  async function handleValidCategorySubmit(categoryData) {
    if (isFormMutationPending) {
      return;
    }

    let mutationThunk;
    let mutationPayload;

    if (isEditMode) {
      mutationThunk = updateCategoryThunk;
      mutationPayload = buildCategoryUpdatePayload(
        categoryData,
        selectedCategory
      );

      if (!mutationPayload) {
        reset(getCategoryEditFormValues(selectedCategory));
        return;
      }
    } else {
      mutationThunk = createCategoryThunk;
      mutationPayload = categoryData;
    }

    const resultAction = await dispatch(mutationThunk(mutationPayload));

    if (!mutationThunk.fulfilled.match(resultAction)) {
      return;
    }

    setIsCategoryModalOpen(false);
    setSelectedCategory(null);

    reset({
      name: "",
      image: null,
    });

    dispatch(fetchCategoriesThunk({ force: true }));
  }

  function handleOpenDeleteModal(category) {
    clearCategoryMutationFeedback();
    setDeletingCategory(category);
  }

  function handleCloseDeleteModal() {
    if (isDeletePending) {
      return;
    }

    dispatch(clearDeleteCategoryRequestFeedback());
    setDeletingCategory(null);
  }

  async function handleConfirmDelete() {
    if (!deletingCategory || isDeletePending) {
      return;
    }

    const resultAction = await dispatch(
      deleteCategoryThunk(deletingCategory._id)
    );

    if (!deleteCategoryThunk.fulfilled.match(resultAction)) {
      return;
    }

    const isDeletingCategoryInFilteredList = filteredCategories.some(
      (category) => category._id === deletingCategory._id
    );
    const remainingFilteredCategoryCount = Math.max(
      0,
      filteredCategories.length -
        (isDeletingCategoryInFilteredList ? 1 : 0)
    );
    const remainingTotalPages = Math.max(
      1,
      Math.ceil(remainingFilteredCategoryCount / CATEGORY_PAGE_SIZE)
    );

    setCurrentPage((page) => Math.min(page, remainingTotalPages));
    setDeletingCategory(null);
    dispatch(fetchCategoriesThunk({ force: true }));
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <PageBreadcrumb
        pageTitle="Categories"
        description="Organize the product catalog using reusable top-level categories."
      />

      <CategoriesToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onAdd={handleOpenCreateModal}
        resultCount={filteredCategories.length}
        isSearchDisabled={!hasCategories}
      />

      {mutationSuccessMessage && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-success-500/30 dark:bg-success-500/10">
          <p className="min-w-0 flex-1 break-words whitespace-pre-wrap text-sm text-success-700 dark:text-success-400">
            {mutationSuccessMessage}
          </p>

          <button
            type="button"
            onClick={clearCategoryMutationFeedback}
            className={`${RETRY_BUTTON_CLASSES} border-success-300 text-success-700 hover:bg-success-100 focus-visible:outline-success-500 dark:border-success-500/40 dark:text-success-400 dark:hover:bg-success-500/10`}
          >
            Dismiss
          </button>
        </div>
      )}

      {isCategoriesUnavailable && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-error-500/30 dark:bg-error-500/10">
          <p className="min-w-0 flex-1 break-words whitespace-pre-wrap text-sm text-error-700 dark:text-error-400">
            {categoriesListError}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className={`${RETRY_BUTTON_CLASSES} border-error-300 text-error-700 hover:bg-error-100 focus-visible:outline-error-500 dark:border-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10`}
          >
            Try again
          </button>
        </div>
      )}

      {hasStaleCategoriesWarning && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-warning-500/30 dark:bg-warning-500/10">
          <div className="min-w-0 flex-1 break-words whitespace-pre-wrap text-sm text-warning-700 dark:text-warning-400">
            <p>
              Categories could not be refreshed. Displaying previously loaded
              data.
            </p>
            <p className="mt-1 text-xs">{categoriesListError}</p>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className={`${RETRY_BUTTON_CLASSES} border-warning-300 text-warning-700 hover:bg-warning-100 focus-visible:outline-warning-500 dark:border-warning-500/40 dark:text-warning-400 dark:hover:bg-warning-500/10`}
          >
            Try again
          </button>
        </div>
      )}

      {!isCategoriesUnavailable && (
        <CategoriesTable
          categories={paginatedCategories}
          isLoading={isInitialCategoriesLoading}
          hasSearchQuery={hasSearchQuery && hasCategories}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          currentPage={visibleCurrentPage}
          totalPages={totalPages}
          totalItems={filteredCategories.length}
          pageSize={CATEGORY_PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryFormModal
          isOpen
          mode={isEditMode ? "edit" : "create"}
          onClose={handleCloseCategoryModal}
          onSubmit={handleSubmit(handleValidCategorySubmit)}
          nameInputProps={register("name")}
          imageInputProps={register("image")}
          control={control}
          originalCategory={selectedCategory}
          previewUrl={selectedCategory?.image ?? ""}
          nameError={errors.name?.message ?? ""}
          imageError={errors.image?.message ?? ""}
          submitError={formMutationError ?? ""}
          isSubmitting={isFormMutationPending}
        />
      )}

      {deletingCategory && (
        <CategoryDeleteModal
          isOpen
          category={deletingCategory}
          error={deleteError ?? ""}
          isDeleting={isDeletePending}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

export default CategoriesPage;

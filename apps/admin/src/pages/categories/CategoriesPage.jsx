import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { zodResolver } from "@hookform/resolvers/zod";

import CategoriesTable from "../../components/categories/CategoriesTable.jsx";
import CategoriesToolbar from "../../components/categories/CategoriesToolbar.jsx";
import CategoryFormModal from "../../components/categories/CategoryFormModal.jsx";
import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";

import {
  clearCreateCategoryRequestFeedback,
  clearUpdateCategoryRequestFeedback,
  createCategoryThunk,
  fetchCategoriesThunk,
  resetCategoryMutationRequestStates,
  selectCategories,
  selectCategoriesListError,
  selectCategoryCreateError,
  selectCategoryCreateSuccessMessage,
  selectCategoryUpdateError,
  selectCategoryUpdateSuccessMessage,
  selectIsCategoriesListPending,
  selectIsCategoryCreatePending,
  selectIsCategoryUpdatePending,
  updateCategoryThunk,
} from "../../features/categories/categoriesSlice.js";

import { categorySchema } from "../../schemas/categories/categorySchema.js";

const CATEGORY_PAGE_SIZE = 5;

function CategoriesPage() {
  const dispatch = useDispatch();

  const categories = useSelector(selectCategories);
  const isListPending = useSelector(selectIsCategoriesListPending);
  const listError = useSelector(selectCategoriesListError);

  const isCreatePending = useSelector(selectIsCategoryCreatePending);
  const createError = useSelector(selectCategoryCreateError);
  const createSuccessMessage = useSelector(selectCategoryCreateSuccessMessage);

  const isUpdatePending = useSelector(selectIsCategoryUpdatePending);
  const updateError = useSelector(selectCategoryUpdateError);
  const updateSuccessMessage = useSelector(selectCategoryUpdateSuccessMessage);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const isEditMode = selectedCategory !== null;

  const isMutationPending = isEditMode ? isUpdatePending : isCreatePending;

  const mutationError = isEditMode ? updateError : createError;

  const mutationSuccessMessage = updateSuccessMessage || createSuccessMessage;

  const {
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
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter((category) =>
      category.name.toLowerCase().includes(normalizedQuery)
    );
  }, [categories, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / CATEGORY_PAGE_SIZE)
  );

  const visibleCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCategories = useMemo(() => {
    const startIndex = (visibleCurrentPage - 1) * CATEGORY_PAGE_SIZE;

    return filteredCategories.slice(
      startIndex,
      startIndex + CATEGORY_PAGE_SIZE
    );
  }, [filteredCategories, visibleCurrentPage]);

  useEffect(() => {
    dispatch(fetchCategoriesThunk());

    return () => {
      dispatch(resetCategoryMutationRequestStates());
    };
  }, [dispatch]);

  function handleRetry() {
    dispatch(fetchCategoriesThunk());
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

  function clearCategoryMutationFeedback() {
    dispatch(clearCreateCategoryRequestFeedback());
    dispatch(clearUpdateCategoryRequestFeedback());
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

    reset({
      name: category.name,
      image: null,
    });

    setIsCategoryModalOpen(true);
  }

  function handleCloseCategoryModal() {
    if (isMutationPending) {
      return;
    }

    clearCategoryMutationFeedback();

    reset({
      name: "",
      image: null,
    });

    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
  }

  async function handleValidCategorySubmit(categoryData) {
    const mutationThunk = isEditMode
      ? updateCategoryThunk
      : createCategoryThunk;

    const mutationPayload = isEditMode
      ? {
          categoryId: selectedCategory._id,
          ...categoryData,
        }
      : categoryData;

    const resultAction = await dispatch(mutationThunk(mutationPayload));

    if (!mutationThunk.fulfilled.match(resultAction)) {
      return;
    }

    reset({
      name: "",
      image: null,
    });

    setIsCategoryModalOpen(false);
    setSelectedCategory(null);

    dispatch(fetchCategoriesThunk({ force: true }));
  }

  return (
    <>
      <PageBreadcrumb
        pageTitle="Categories"
        description="Organize the product catalog using reusable top-level categories."
      />

      <CategoriesToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onAdd={handleOpenCreateModal}
        resultCount={filteredCategories.length}
      />

      {mutationSuccessMessage && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-success-500/30 dark:bg-success-500/10">
          <p className="text-sm text-success-700 dark:text-success-400">
            {mutationSuccessMessage}
          </p>

          <button
            type="button"
            onClick={clearCategoryMutationFeedback}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-success-300 bg-white px-3 py-2 text-sm font-medium text-success-700 shadow-theme-xs transition hover:bg-success-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success-500 dark:border-success-500/40 dark:bg-transparent dark:text-success-400 dark:hover:bg-success-500/10"
          >
            Dismiss
          </button>
        </div>
      )}

      {listError && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-error-500/30 dark:bg-error-500/10">
          <p className="text-sm text-error-700 dark:text-error-400">
            {listError}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-error-300 bg-white px-3 py-2 text-sm font-medium text-error-700 shadow-theme-xs transition hover:bg-error-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500 dark:border-error-500/40 dark:bg-transparent dark:text-error-400 dark:hover:bg-error-500/10"
          >
            Try again
          </button>
        </div>
      )}

      {!(listError && categories.length === 0) && (
        <CategoriesTable
          categories={paginatedCategories}
          isLoading={isListPending}
          hasSearchQuery={hasSearchQuery}
          onEdit={handleOpenEditModal}
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
          previewUrl={selectedCategory?.image ?? ""}
          nameError={errors.name?.message ?? ""}
          imageError={errors.image?.message ?? ""}
          submitError={mutationError ?? ""}
          isSubmitting={isMutationPending}
        />
      )}
    </>
  );
}

export default CategoriesPage;

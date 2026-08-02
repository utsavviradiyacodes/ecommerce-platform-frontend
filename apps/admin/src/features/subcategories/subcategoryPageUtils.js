import { getSubcategoryCategoryId } from "./subcategoryFormUtils.js";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getSubcategoryCategoryName(
  subcategory,
  fallbackName = ""
) {
  const category = subcategory?.category;

  if (!category || typeof category !== "object") {
    return fallbackName;
  }

  return normalizeText(category.name) || fallbackName;
}

export function buildSubcategoryCategoryOptions(categories = []) {
  return categories.reduce((options, category) => {
    const categoryId = normalizeText(category?._id);

    if (!categoryId) {
      return options;
    }

    options.push({
      value: categoryId,
      label: normalizeText(category?.name) || "Unnamed category",
    });

    return options;
  }, []);
}

export function buildSubcategoryFormCategoryOptions(
  categoryOptions = [],
  selectedSubcategory = null
) {
  if (!selectedSubcategory) {
    return categoryOptions;
  }

  const currentCategoryId = getSubcategoryCategoryId(selectedSubcategory);
  const hasCurrentCategoryOption = categoryOptions.some(
    (option) => option.value === currentCategoryId
  );

  if (!currentCategoryId || hasCurrentCategoryOption) {
    return categoryOptions;
  }

  const currentCategoryName = getSubcategoryCategoryName(
    selectedSubcategory,
    "Current category"
  );

  return [
    {
      value: currentCategoryId,
      label: `${currentCategoryName} (current)`,
      disabled: true,
    },
    ...categoryOptions,
  ];
}

export function filterSubcategories(
  subcategories = [],
  searchQuery = "",
  selectedCategoryId = ""
) {
  const normalizedSearchQuery = normalizeText(searchQuery).toLowerCase();

  return subcategories.filter((subcategory) => {
    const subcategoryName = normalizeText(subcategory?.name).toLowerCase();
    const matchesSearch =
      !normalizedSearchQuery ||
      subcategoryName.includes(normalizedSearchQuery);
    const matchesCategory =
      !selectedCategoryId ||
      getSubcategoryCategoryId(subcategory) === selectedCategoryId;

    return matchesSearch && matchesCategory;
  });
}

export function paginateSubcategories(
  subcategories = [],
  requestedPage = 1,
  pageSize = 5
) {
  const totalPages = Math.max(1, Math.ceil(subcategories.length / pageSize));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    currentPage,
    totalPages,
    items: subcategories.slice(startIndex, startIndex + pageSize),
  };
}

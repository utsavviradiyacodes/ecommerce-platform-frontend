function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getSubcategoryCategoryId(subcategory) {
  const category = subcategory?.category;

  if (category && typeof category === "object") {
    return normalizeText(category._id);
  }

  return normalizeText(category);
}

export function getSubcategoryEditFormValues(subcategory) {
  return {
    name: normalizeText(subcategory?.name),
    categoryId: getSubcategoryCategoryId(subcategory),
    image: null,
  };
}

function getSubcategoryChangeState(
  { name = "", categoryId = "" } = {},
  originalSubcategory,
  hasReplacementImage = false
) {
  return {
    name: normalizeText(name) !== normalizeText(originalSubcategory?.name),
    categoryId:
      normalizeText(categoryId) !==
      getSubcategoryCategoryId(originalSubcategory),
    image: hasReplacementImage,
  };
}

export function hasMeaningfulSubcategoryChanges(
  subcategoryData,
  originalSubcategory,
  hasReplacementImage = false
) {
  return Object.values(
    getSubcategoryChangeState(
      subcategoryData,
      originalSubcategory,
      hasReplacementImage
    )
  ).some(Boolean);
}

export function buildSubcategoryUpdatePayload(
  subcategoryData,
  originalSubcategory
) {
  const normalizedName = normalizeText(subcategoryData.name);
  const normalizedCategoryId = normalizeText(subcategoryData.categoryId);
  const changeState = getSubcategoryChangeState(
    {
      name: normalizedName,
      categoryId: normalizedCategoryId,
    },
    originalSubcategory,
    Boolean(subcategoryData.image)
  );

  const updatePayload = {
    subcategoryId: originalSubcategory._id,
  };

  if (changeState.name) {
    updatePayload.name = normalizedName;
  }

  if (changeState.categoryId) {
    updatePayload.categoryId = normalizedCategoryId;
  }

  if (changeState.image) {
    updatePayload.image = subcategoryData.image;
  }

  return Object.keys(updatePayload).length > 1 ? updatePayload : null;
}

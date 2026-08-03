import axiosInstance from "../../api/axiosInstance.js";

const PRODUCT_UPDATE_FIELDS = [
  "name",
  "description",
  "price",
  "originalPrice",
  "categoryId",
  "subcategoryId",
  "stock",
  "tags",
];

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function hasQueryValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function appendImages(formData, images) {
  if (!images) {
    return;
  }

  const imageFiles = Array.isArray(images) ? images : Array.from(images);

  imageFiles.forEach((image) => {
    if (image) {
      formData.append("images", image);
    }
  });
}

export function buildProductsListParams({
  page,
  limit,
  search,
  approvalStatus,
  isActive,
} = {}) {
  const params = {};

  if (hasQueryValue(page)) {
    params.page = page;
  }

  if (hasQueryValue(limit)) {
    params.limit = limit;
  }

  const normalizedSearch =
    typeof search === "string" ? search.trim() : "";

  if (normalizedSearch) {
    params.search = normalizedSearch;
  }

  const normalizedApprovalStatus =
    typeof approvalStatus === "string" ? approvalStatus.trim() : "";

  if (normalizedApprovalStatus) {
    params.approvalStatus = normalizedApprovalStatus;
  }

  if (isActive === true || isActive === false) {
    params.isActive = isActive;
  } else if (isActive === "true" || isActive === "false") {
    params.isActive = isActive;
  }

  return params;
}

export async function getProducts(query) {
  const response = await axiosInstance.get("/admin/getAllProductsAdmin", {
    params: buildProductsListParams(query),
  });

  return response.data;
}

export async function getProductDetails(productId) {
  const response = await axiosInstance.get(`/admin/product/${productId}`);

  return response.data;
}

export async function addProduct({
  name,
  description,
  price,
  originalPrice,
  categoryId,
  subcategoryId,
  stock,
  tags,
  images,
}) {
  const formData = new FormData();

  formData.append("name", name);
  formData.append("description", description);
  formData.append("price", price);
  formData.append("categoryId", categoryId);
  formData.append("subcategoryId", subcategoryId);
  formData.append("stock", stock);

  if (
    originalPrice !== undefined &&
    originalPrice !== null &&
    originalPrice !== ""
  ) {
    formData.append("originalPrice", originalPrice);
  }

  if (typeof tags === "string" && tags.trim()) {
    formData.append("tags", tags.trim());
  }

  appendImages(formData, images);

  const response = await axiosInstance.post("/admin/product/add", formData);

  return response.data;
}

export async function updateProduct({ productId, changes, ...inlineChanges }) {
  const productChanges =
    changes && typeof changes === "object" ? changes : inlineChanges;
  const formData = new FormData();

  PRODUCT_UPDATE_FIELDS.forEach((field) => {
    if (!hasOwn(productChanges, field)) {
      return;
    }

    const value = productChanges[field];

    if (value === undefined || value === null) {
      return;
    }

    if (field === "originalPrice" && value === "") {
      return;
    }

    // The backend casts an empty tags string to [""], not an empty array.
    // Omitting an attempted empty value preserves the existing tag set.
    if (field === "tags" && String(value).trim() === "") {
      return;
    }

    formData.append(field, field === "tags" ? String(value).trim() : value);
  });

  appendImages(formData, productChanges.images);

  const response = await axiosInstance.post(
    `/admin/product/update/${productId}`,
    formData
  );

  return response.data;
}

export async function approveProduct(productId) {
  const response = await axiosInstance.post(
    `/admin/activeProduct/${productId}`
  );

  return response.data;
}

export async function rejectProduct({ productId, rejectedReason }) {
  const response = await axiosInstance.post(
    `/admin/deactiveProduct/${productId}`,
    { rejectedReason }
  );

  return response.data;
}

export async function toggleProductStatus(productId) {
  const response = await axiosInstance.post(
    `/admin/product/toggle-status/${productId}`
  );

  return response.data;
}

export async function archiveProduct(productId) {
  const response = await axiosInstance.delete(
    `/admin/product/soft-delete/${productId}`
  );

  return response.data;
}

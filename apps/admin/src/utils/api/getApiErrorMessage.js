import axios from "axios";

const DEFAULT_API_ERROR_MESSAGE = "Something went wrong.";

function getNonEmptyString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue || null;
}

export function getApiErrorMessage(
  error,
  fallbackMessage = DEFAULT_API_ERROR_MESSAGE
) {
  const backendMessage = getNonEmptyString(error?.response?.data?.message);

  if (backendMessage) {
    return backendMessage;
  }

  const errorMessage =
    error instanceof Error && !axios.isAxiosError(error)
      ? getNonEmptyString(error.message)
      : null;

  if (errorMessage) {
    return errorMessage;
  }

  return getNonEmptyString(fallbackMessage) || DEFAULT_API_ERROR_MESSAGE;
}

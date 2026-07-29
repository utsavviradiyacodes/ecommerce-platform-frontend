export const REQUEST_STATUS = {
  IDLE: "idle",
  PENDING: "pending",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
};

export function createRequestState(initialStatus = REQUEST_STATUS.IDLE) {
  return {
    status: initialStatus,
    error: null,
    successMessage: null,
  };
}

export function setRequestPending(requestState) {
  requestState.status = REQUEST_STATUS.PENDING;
  requestState.error = null;
  requestState.successMessage = null;
}

export function setRequestSucceeded(requestState, successMessage = null) {
  requestState.status = REQUEST_STATUS.SUCCEEDED;
  requestState.error = null;
  requestState.successMessage = successMessage;
}

export function setRequestFailed(requestState, error) {
  requestState.status = REQUEST_STATUS.FAILED;
  requestState.error = error;
  requestState.successMessage = null;
}

export function resetRequestState(requestState) {
  requestState.status = REQUEST_STATUS.IDLE;
  requestState.error = null;
  requestState.successMessage = null;
}

export function getRejectedActionErrorMessage(
  action,
  fallbackMessage = "Request failed. Please try again."
) {
  const payloadMessage =
    typeof action.payload === "string"
      ? action.payload
      : action.payload?.message;

  return payloadMessage || action.error?.message || fallbackMessage;
}

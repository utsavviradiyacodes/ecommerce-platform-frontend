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
    activeRequestId: null,
  };
}

export function setRequestPending(requestState, requestId = null) {
  requestState.status = REQUEST_STATUS.PENDING;
  requestState.error = null;
  requestState.successMessage = null;
  requestState.activeRequestId = requestId;
}

export function setRequestSucceeded(requestState, successMessage = null) {
  requestState.status = REQUEST_STATUS.SUCCEEDED;
  requestState.error = null;
  requestState.successMessage = successMessage;
  requestState.activeRequestId = null;
}

export function setRequestFailed(requestState, error) {
  requestState.status = REQUEST_STATUS.FAILED;
  requestState.error = error;
  requestState.successMessage = null;
  requestState.activeRequestId = null;
}

export function clearRequestFeedback(requestState) {
  requestState.error = null;
  requestState.successMessage = null;
}

export function resetRequestState(requestState) {
  requestState.status = REQUEST_STATUS.IDLE;
  requestState.error = null;
  requestState.successMessage = null;
  requestState.activeRequestId = null;
}

export function isRequestStateOwnedBy(requestState, requestId) {
  return requestState.activeRequestId === requestId;
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

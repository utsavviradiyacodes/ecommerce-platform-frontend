import { combineReducers, configureStore } from "@reduxjs/toolkit";

import authReducer, {
  initializeAdminSessionThunk,
  invalidateAdminSession,
  restoreAdminEmailVerificationSession,
  restoreAdminPasswordRecoverySession,
  signInAdminSucceeded,
  signOutAdminThunk,
  verifyAdminEmailSucceeded,
} from "../features/auth/authSlice.js";
import { ADMIN_PASSWORD_RECOVERY_PHASE } from "../features/auth/authConstants.js";
import { clearAdminPasswordResetSecret } from "../features/auth/adminPasswordResetSecret.js";
import adminsReducer from "../features/admins/adminsSlice.js";
import categoriesReducer from "../features/categories/categoriesSlice.js";
import customersReducer, {
  abortAndClearPendingCustomersListRequests,
} from "../features/customers/customersSlice.js";
import sellersReducer, {
  abortAndClearPendingSellersListRequests,
} from "../features/sellers/sellersSlice.js";
import productsReducer, {
  abortAndClearPendingProductsListRequests,
} from "../features/products/productsSlice.js";
import subcategoriesReducer from "../features/subcategories/subcategoriesSlice.js";
import dashboardReducer from "../features/dashboard/dashboardSlice.js";
import ordersReducer from "../features/orders/ordersSlice.js";
import paymentsReducer from "../features/payments/paymentsSlice.js";
import returnsReducer from "../features/returns/returnsSlice.js";
import profileReducer from "../features/profile/profileSlice.js";
import settingsReducer from "../features/settings/settingsSlice.js";

import {
  clearAdminPasswordRecoverySession,
  readAdminPasswordRecoverySession,
  writeAdminPasswordRecoverySession,
} from "../utils/storage/adminPasswordRecoverySession.js";
import {
  readAdminEmailVerificationSession,
  writeAdminEmailVerificationSession,
} from "../utils/storage/adminEmailVerificationSession.js";
import { isRequestStateOwnedBy } from "../utils/redux/requestState.js";

const REDACTED_DEVTOOLS_VALUE = "[REDACTED]";

function sanitizeAdminDevToolsAction(action) {
  if (action?.type === "auth/setAdminAccessToken") {
    return {
      ...action,
      payload: REDACTED_DEVTOOLS_VALUE,
    };
  }

  if (
    typeof action?.type !== "string" ||
    !action.type.startsWith("auth/") ||
    !action.payload ||
    typeof action.payload !== "object"
  ) {
    return action;
  }

  const hasAccessToken = typeof action.payload.accessToken === "string";
  const hasToken = typeof action.payload.token === "string";
  const hasNestedToken =
    action.payload.data &&
    typeof action.payload.data === "object" &&
    typeof action.payload.data.token === "string";

  if (!hasAccessToken && !hasToken && !hasNestedToken) {
    return action;
  }

  return {
    ...action,
    payload: {
      ...action.payload,
      ...(hasAccessToken
        ? { accessToken: REDACTED_DEVTOOLS_VALUE }
        : {}),
      ...(hasToken ? { token: REDACTED_DEVTOOLS_VALUE } : {}),
      ...(hasNestedToken
        ? {
            data: {
              ...action.payload.data,
              token: REDACTED_DEVTOOLS_VALUE,
            },
          }
        : {}),
    },
  };
}

function sanitizeAdminDevToolsState(state) {
  if (!state?.auth) {
    return state;
  }

  return {
    ...state,
    auth: {
      ...state.auth,
      accessToken: state.auth.accessToken
        ? REDACTED_DEVTOOLS_VALUE
        : state.auth.accessToken,
    },
  };
}

const appReducer = combineReducers({
  admins: adminsReducer,
  auth: authReducer,
  dashboard: dashboardReducer,
  categories: categoriesReducer,
  customers: customersReducer,
  orders: ordersReducer,
  payments: paymentsReducer,
  returns: returnsReducer,
  sellers: sellersReducer,
  products: productsReducer,
  subcategories: subcategoriesReducer,
  profile: profileReducer,
  settings: settingsReducer,
});

function isOwnedAuthRequest(state, requestKey, requestId) {
  return isRequestStateOwnedBy(
    state?.auth?.requests?.[requestKey],
    requestId
  );
}

function isAcceptedAdminIdentityBoundary(state, action) {
  if (invalidateAdminSession.match(action)) {
    return true;
  }

  if (signInAdminSucceeded.match(action)) {
    return isOwnedAuthRequest(
      state,
      "signIn",
      action.payload?.requestId
    );
  }

  if (verifyAdminEmailSucceeded.match(action)) {
    return isOwnedAuthRequest(
      state,
      "verifyEmail",
      action.payload?.requestId
    );
  }

  if (initializeAdminSessionThunk.fulfilled.match(action)) {
    return isOwnedAuthRequest(
      state,
      "initializeSession",
      action.meta.requestId
    );
  }

  if (signOutAdminThunk.fulfilled.match(action)) {
    return isOwnedAuthRequest(
      state,
      "signOut",
      action.meta.requestId
    );
  }

  return false;
}

function normalizeAdminSessionGeneration(value) {
  return Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : 0;
}

function rootReducer(state, action) {
  const isAcceptedIdentityBoundary = isAcceptedAdminIdentityBoundary(
    state,
    action
  );
  const stateForAction = isAcceptedIdentityBoundary
    ? { auth: state?.auth }
    : state;
  const nextState = appReducer(stateForAction, action);

  if (!isAcceptedIdentityBoundary) {
    return nextState;
  }

  return {
    ...nextState,
    auth: {
      ...nextState.auth,
      sessionGeneration:
        normalizeAdminSessionGeneration(state?.auth?.sessionGeneration) + 1,
    },
  };
}

function abortAndClearPendingAdminDomainRequests() {
  abortAndClearPendingProductsListRequests();
  abortAndClearPendingCustomersListRequests();
  abortAndClearPendingSellersListRequests();
}

const adminIdentityBoundaryMiddleware =
  ({ getState }) =>
  (next) =>
  (action) => {
    const isAcceptedBoundary = isAcceptedAdminIdentityBoundary(
      getState(),
      action
    );
    const result = next(action);

    if (isAcceptedBoundary) {
      abortAndClearPendingAdminDomainRequests();
    }

    return result;
  };

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(adminIdentityBoundaryMiddleware),
  devTools: import.meta.env.PROD
    ? false
    : {
        actionSanitizer: sanitizeAdminDevToolsAction,
        stateSanitizer: sanitizeAdminDevToolsState,
      },
});

const savedPasswordRecovery = readAdminPasswordRecoverySession();
const savedEmailVerification = readAdminEmailVerificationSession();

if (savedEmailVerification) {
  clearAdminPasswordRecoverySession();
  store.dispatch(
    restoreAdminEmailVerificationSession(savedEmailVerification)
  );
} else if (savedPasswordRecovery) {
  store.dispatch(restoreAdminPasswordRecoverySession(savedPasswordRecovery));
}

let previousPasswordRecovery = store.getState().auth.passwordRecovery;
let previousEmailVerificationContext =
  store.getState().auth.emailVerification.context;

store.subscribe(() => {
  const currentPasswordRecovery = store.getState().auth.passwordRecovery;

  const hasPasswordRecoveryChanged =
    currentPasswordRecovery.email !== previousPasswordRecovery.email ||
    currentPasswordRecovery.userId !== previousPasswordRecovery.userId ||
    currentPasswordRecovery.resendAvailableAt !==
      previousPasswordRecovery.resendAvailableAt ||
    currentPasswordRecovery.phase !== previousPasswordRecovery.phase;

  if (
    currentPasswordRecovery.phase !==
    ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED
  ) {
    clearAdminPasswordResetSecret();
  }

  if (hasPasswordRecoveryChanged) {
    writeAdminPasswordRecoverySession(currentPasswordRecovery);
    previousPasswordRecovery = currentPasswordRecovery;
  }

  const currentEmailVerificationContext =
    store.getState().auth.emailVerification.context;

  if (currentEmailVerificationContext !== previousEmailVerificationContext) {
    writeAdminEmailVerificationSession(currentEmailVerificationContext);
    previousEmailVerificationContext = currentEmailVerificationContext;
  }
});

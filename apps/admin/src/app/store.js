import { configureStore } from "@reduxjs/toolkit";

import authReducer, {
  restoreAdminPasswordRecoverySession,
} from "../features/auth/authSlice.js";
import categoriesReducer from "../features/categories/categoriesSlice.js";
import productsReducer from "../features/products/productsSlice.js";
import subcategoriesReducer from "../features/subcategories/subcategoriesSlice.js";

import {
  readAdminPasswordRecoverySession,
  writeAdminPasswordRecoverySession,
} from "../utils/storage/adminPasswordRecoverySession.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoriesReducer,
    products: productsReducer,
    subcategories: subcategoriesReducer,
  },
});

const savedPasswordRecovery = readAdminPasswordRecoverySession();

if (savedPasswordRecovery) {
  store.dispatch(restoreAdminPasswordRecoverySession(savedPasswordRecovery));
}

let previousPasswordRecovery = store.getState().auth.passwordRecovery;

store.subscribe(() => {
  const currentPasswordRecovery = store.getState().auth.passwordRecovery;

  const hasPasswordRecoveryChanged =
    currentPasswordRecovery.email !== previousPasswordRecovery.email ||
    currentPasswordRecovery.userId !== previousPasswordRecovery.userId ||
    currentPasswordRecovery.resendAvailableAt !==
      previousPasswordRecovery.resendAvailableAt ||
    currentPasswordRecovery.verifiedOtp !==
      previousPasswordRecovery.verifiedOtp ||
    currentPasswordRecovery.phase !== previousPasswordRecovery.phase;

  if (!hasPasswordRecoveryChanged) {
    return;
  }

  writeAdminPasswordRecoverySession(currentPasswordRecovery);

  previousPasswordRecovery = currentPasswordRecovery;
});

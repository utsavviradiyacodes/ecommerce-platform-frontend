import { configureStore } from "@reduxjs/toolkit";

import authReducer, {
  restoreAdminPasswordRecoverySession,
} from "../features/auth/authSlice.js";
import categoriesReducer from "../features/categories/categoriesSlice.js";
import customersReducer from "../features/customers/customersSlice.js";
import sellersReducer from "../features/sellers/sellersSlice.js";
import productsReducer from "../features/products/productsSlice.js";
import subcategoriesReducer from "../features/subcategories/subcategoriesSlice.js";
import dashboardReducer from "../features/dashboard/dashboardSlice.js";
import ordersReducer from "../features/orders/ordersSlice.js";
import profileReducer from "../features/profile/profileSlice.js";

import {
  readAdminPasswordRecoverySession,
  writeAdminPasswordRecoverySession,
} from "../utils/storage/adminPasswordRecoverySession.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    categories: categoriesReducer,
    customers: customersReducer,
    orders: ordersReducer,
    sellers: sellersReducer,
    products: productsReducer,
    subcategories: subcategoriesReducer,
    profile: profileReducer,
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

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { Provider } from "react-redux";
import { store } from "./app/store.js";

import { BrowserRouter } from "react-router";

import { initializeAdminSessionThunk } from "./features/auth/authSlice.js";
import { setupAxiosInterceptors } from "./api/setupAxiosInterceptors.js";

setupAxiosInterceptors(store);

store.dispatch(initializeAdminSessionThunk());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);

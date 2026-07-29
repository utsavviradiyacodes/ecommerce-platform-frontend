import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";

import Label from "../../components/form/Label.jsx";
import InputField from "../../components/form/input/InputField.jsx";
import Button from "../../components/ui/button/Button.jsx";

import {
  loginAdminThunk,
  selectAdminLoginError,
  selectIsAdminLoginPending,
} from "../../features/auth/authSlice.js";

import { EyeCloseIcon, EyeIcon, GoogleIcon, XIcon } from "../../icons/index.js";
import { loginSchema } from "../../schemas/auth/loginSchema.js";

function LoginPage() {
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);

  const isAdminLoginPending = useSelector(selectIsAdminLoginPending);
  const adminLoginError = useSelector(selectAdminLoginError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function handleLogin(formData) {
    dispatch(loginAdminThunk(formData));
  }

  return (
    <div className="flex h-full w-full items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full max-w-110">
        {/* Page heading */}
        <div className="mb-7">
          <h1 className="mb-2 text-4xl font-semibold text-gray-800 dark:text-white/90">
            Sign In
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email and password to sign in.
          </p>
        </div>

        {/* Social-login placeholders */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled
            title="Google sign in is not available yet"
            className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg bg-gray-100 px-4 py-3 text-sm font-normal text-gray-700 dark:bg-white/5 dark:text-white/90"
          >
            <GoogleIcon className="size-5 shrink-0" />
            Sign in with Google
          </button>

          <button
            type="button"
            disabled
            title="X sign in is not available yet"
            className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg bg-gray-100 px-4 py-3 text-sm font-normal text-gray-700 dark:bg-white/5 dark:text-white/90"
          >
            <XIcon className="size-5 shrink-0" />
            Sign in with X
          </button>
        </div>

        {/* Divider */}
        <div className="relative py-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
          </div>

          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-sm text-gray-400 dark:bg-gray-900">
              Or
            </span>
          </div>
        </div>

        <form
          className="space-y-5"
          onSubmit={handleSubmit(handleLogin)}
          noValidate
        >
          {/* Email */}
          <div>
            <Label htmlFor="email">
              Email <span className="text-error-500">*</span>
            </Label>

            <InputField
              type="email"
              id="email"
              placeholder="info@gmail.com"
              autoComplete="email"
              error={Boolean(errors.email)}
              hint={errors.email?.message}
              {...register("email")}
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">
              Password <span className="text-error-500">*</span>
            </Label>

            <div className="relative">
              <InputField
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                className="pr-11"
                error={Boolean(errors.password)}
                hint={errors.password?.message}
                {...register("password")}
              />

              <button
                type="button"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                className="absolute top-5.5 right-4 z-30 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? (
                  <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                ) : (
                  <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                )}

                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </button>
            </div>
          </div>

          {/* Forgot-password link */}
          <div className="flex justify-end">
            <Link
              to="/admin/forgot-password"
              className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>

          {/* Backend error */}
          {adminLoginError && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {adminLoginError}
            </p>
          )}

          <Button type="submit" disabled={isAdminLoginPending} className="w-full">
            {isAdminLoginPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

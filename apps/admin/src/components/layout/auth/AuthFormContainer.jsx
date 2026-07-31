function AuthFormContainer({ children }) {
  return (
    <div className="flex w-full flex-1 flex-col px-6 py-10 sm:px-8 lg:px-10 xl:px-16">
      <div className="my-auto w-full max-w-lg self-center">{children}</div>
    </div>
  );
}

export default AuthFormContainer;

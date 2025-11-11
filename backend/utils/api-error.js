class ApiError extends Error {
  constructor(
    status,
    message = "Something went wrong",
    success = false,
    errors = [],
    stack = "",
  ) {
    success(message);
    this.status = status;
    this.message = message;
    this.success = success;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export default ApiError;

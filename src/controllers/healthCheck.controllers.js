import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";

export const healthCheck = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponseHandler(200, { status: "ok" }, "Healthcheck ok"));
});

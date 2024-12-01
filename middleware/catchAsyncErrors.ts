import { NextFunction, Request, Response } from "express"; // Importing types from Express for request, response, and next function

// Wrapper function to catch and handle asynchronous errors in route handlers
export const CatchAsyncError =
  (
    theFunc: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    // Resolve the asynchronous function and catch any errors, passing them to the next middleware
    Promise.resolve(theFunc(req, res, next)).catch(next);
  };

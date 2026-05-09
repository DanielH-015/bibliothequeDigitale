import { Router as ExpressRouter } from 'express';

 // Custom Router Wrapper
 // This allows us to use `async (req) => { return data; }` in our routes.
 //It intercepts the returned Promise and automatically sends the JSON response.

export function Router() {
  const router = ExpressRouter();
  const methods = ['get', 'post', 'put', 'delete', 'patch'];

  methods.forEach(method => {
    const original = router[method].bind(router);
    router[method] = (path, ...handlers) => {
      const wrappedHandlers = handlers.map(handler => {
        // If the handler is an async function
        if (typeof handler === 'function' && handler.constructor.name === 'AsyncFunction') {
          return async (req, res, next) => {
            try {
               const result = await handler(req, res, next);
               // If no response has been sent yet
               if (!res.headersSent) {
                 if (result !== undefined) {
                   res.json(result);
                 } else {
                   // If the service doesn't return anything (like in a DELETE operation), send a generic success message
                   res.json({ message: "Operation completed successfully." });
                 }
               }
            } catch (err) {
               next(err);
            }
          };
        }
        return handler;
      });
      return original(path, ...wrappedHandlers);
    };
  });

  // We also need to expose 'use'
  const originalUse = router.use.bind(router);
  router.use = (...args) => {
    return originalUse(...args);
  };

  return router;
}

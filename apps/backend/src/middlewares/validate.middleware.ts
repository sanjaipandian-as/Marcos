import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Replace req items with typed/parsed items if needed
      if ('body' in parsed) req.body = parsed.body;
      if ('query' in parsed) req.query = parsed.query;
      if ('params' in parsed) req.params = parsed.params;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.log('Validation error in schema:', req.originalUrl);
        console.log('Payload:', JSON.stringify({ body: req.body, query: req.query, params: req.params }));
        console.log('Errors:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return next(error);
    }
  };
}

export default validate;

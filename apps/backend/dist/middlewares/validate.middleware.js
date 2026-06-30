"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
function validate(schema) {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            // Replace req items with typed/parsed items if needed
            if ('body' in parsed)
                req.body = parsed.body;
            if ('query' in parsed)
                req.query = parsed.query;
            if ('params' in parsed)
                req.params = parsed.params;
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
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
exports.default = validate;

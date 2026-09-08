import { z } from 'zod';

/**
 * Zod validation middleware factory.
 * Usage: router.post('/path', validate(mySchema), handler)
 * Validates req.body against the provided Zod schema.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req.body = result.data;
    next();
  };
}

/* =========================================================================
   REUSABLE VALIDATION SCHEMAS
   ========================================================================= */

export const customerRegisterSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  address: z.object({
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  discipline: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  benefits: z.string().optional(),
  ingredients: z.string().optional(),
  volume: z.string().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  image_url: z.string().url('Image URL must be a valid URL'),
  sensorialFragrance: z.string().optional(),
  sensorialTexture: z.string().optional(),
  sensorialFinish: z.string().optional(),
  clinicalMetric1Val: z.string().optional(),
  clinicalMetric1Lbl: z.string().optional(),
  clinicalMetric2Val: z.string().optional(),
  clinicalMetric2Lbl: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  shades: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
});

export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
  })).min(1, 'At least one item is required'),
  customerInfo: z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
  shippingAddress: z.object({
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  }),
  paymentMethod: z.string().optional(),
  promoCode: z.string().optional(),
});

export const reviewSchema = z.object({
  customerName: z.string().min(1, 'Name is required'),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(1, 'Review title is required'),
  comment: z.string().min(10, 'Review comment must be at least 10 characters'),
});

export const inventoryAdjustSchema = z.object({
  productId: z.coerce.number().int().positive(),
  changeAmount: z.coerce.number().int().optional(),
  newStock: z.coerce.number().int().min(0).optional(),
  reason: z.string().optional(),
});

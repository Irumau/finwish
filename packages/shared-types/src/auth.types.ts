import { z } from "zod";

const emailField = z.string().trim().toLowerCase().pipe(z.email().max(255));
const passwordField = z.string().min(8).max(128);
const currentPasswordField = z.string().min(1).max(128); // solo se exige que no esté vacía
const nameField = z.string().trim().min(1).max(100);
// Monedas que soporta la app (ISO 4217). Es la única fuente de verdad: la API valida contra
// esta lista y el frontend puede usarla para el desplegable de moneda.
export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "ARS",
  "COP",
  "CLP",
] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const currencyField = z
  .string()
  .trim()
  .toUpperCase() // acepta "usd" y lo normaliza a "USD" antes de validar
  .pipe(z.enum(SUPPORTED_CURRENCIES, { error: "Moneda no soportada" }));
// Países soportados (ISO 3166-1 alfa-2). Moneda y país se eligen por separado.
// ES representa a la zona euro por ahora; se amplía añadiendo códigos a la lista.
export const SUPPORTED_COUNTRIES = ["US", "ES", "AR", "CO", "CL"] as const;
export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

const countryField = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(SUPPORTED_COUNTRIES, { error: "País no soportado" }));

export const createUserSchema = z.object({
  email: emailField,
  password: passwordField,
  firstName: nameField,
  lastName: nameField,
  currencyCode: currencyField.optional(),
  countryCode: countryField.optional(),
});

export const updateUserSchema = createUserSchema
  .partial()
  .omit({ password: true, email: true })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  }); // no se puede cambiar ni el email ni la contraseña con este endpoint. La idea es que este derivado a uno schema que solo permita cambiar la contraseña, y otro que permita cambiar el email.

export const loginUserSchema = z.object({
  email: emailField,
  password: currentPasswordField,
});

export const changePasswordSchema = z.object({
  currentPassword: currentPasswordField,
  newPassword: passwordField,
});

export const changeEmailSchema = z.object({
  newEmail: emailField,
  currentPassword: currentPasswordField,
});

export const userSchema = createUserSchema
  .omit({ password: true })
  .extend({
    id: z.uuid(),
    createdAt: z.iso.datetime().nullable(),
    updatedAt: z.iso.datetime().nullable(),
  })
  .required({ currencyCode: true, countryCode: true }); // lo que se devuelve al cliente no incluye el password

// Respuesta del login: el refresh token NO va aquí, viaja en una cookie HttpOnly.
export const loginResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type User = z.infer<typeof userSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

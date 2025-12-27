import { z } from "zod";

export const transactionSchema = z.object({
  ticker: z
    .string()
    .min(1, "Ticker é obrigatório")
    .max(10, "Ticker deve ter no máximo 10 caracteres")
    .regex(/^[A-Z0-9]+$/, "Ticker deve conter apenas letras maiúsculas e números")
    .transform((val) => val.toUpperCase()),
  asset_name: z
    .string()
    .min(1, "Nome do ativo é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim(),
  asset_class_id: z
    .string()
    .uuid("Classe de ativo inválida"),
  transaction_type: z.enum(["buy", "sell"], {
    errorMap: () => ({ message: "Tipo de transação inválido" }),
  }),
  quantity: z
    .number({ invalid_type_error: "Quantidade deve ser um número" })
    .positive("Quantidade deve ser positiva")
    .finite("Quantidade inválida"),
  price_per_unit: z
    .number({ invalid_type_error: "Preço deve ser um número" })
    .positive("Preço deve ser positivo")
    .finite("Preço inválido"),
  fees: z
    .number({ invalid_type_error: "Taxas devem ser um número" })
    .nonnegative("Taxas não podem ser negativas")
    .finite("Taxas inválidas")
    .default(0),
  transaction_date: z.date({
    required_error: "Data é obrigatória",
    invalid_type_error: "Data inválida",
  }),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

export const assetClassSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .trim(),
  description: z
    .string()
    .max(200, "Descrição deve ter no máximo 200 caracteres")
    .trim()
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser um código hex válido (ex: #FF0000)")
    .default("#6366f1"),
});

export type AssetClassFormData = z.infer<typeof assetClassSchema>;

import mongoose, { Schema, type InferSchemaType } from "mongoose";

export type SchoolType = "ilkokul" | "ortaokul" | "lise" | "diger";

const SchoolSchema = new Schema(
  {
    name: { type: String, required: true },
    schoolType: {
      type: String,
      enum: ["ilkokul", "ortaokul", "lise", "diger"],
      required: true,
    },
    barcodeEnabled: { type: Boolean, default: true },
    shelves: { type: [String], default: [] },
    defaultLoanDays: { type: Number, default: 14, min: 1, max: 365 },
    loanDaysLocked: { type: Boolean, default: false },
    maxLoanExtensions: { type: Number, default: 2, min: 0, max: 20 },
    logoMimeType: { type: String, default: null },
    logoBase64: { type: String, default: null },
    logoBinary: { type: Buffer, default: null },
  },
  { timestamps: true }
);

export type SchoolDoc = InferSchemaType<typeof SchoolSchema> & { _id: mongoose.Types.ObjectId };

export const School = mongoose.models.School ?? mongoose.model("School", SchoolSchema);

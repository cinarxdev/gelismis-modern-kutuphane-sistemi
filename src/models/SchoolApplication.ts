import mongoose, { Schema, type InferSchemaType } from "mongoose";

const SchoolApplicationSchema = new Schema(
  {
    schoolName: { type: String, required: true },
    schoolType: {
      type: String,
      enum: ["ilkokul", "ortaokul", "lise", "diger"],
      required: true,
    },
    studentCount: { type: Number, default: 0 },
    bookCountRange: { type: String, default: "" },

    il: { type: String, required: true },
    ilce: { type: String, required: true },
    adres: { type: String, default: "" },

    contactName: { type: String, required: true },
    contactRole: { type: String, default: "" },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },

    website: { type: String, default: "" },
    notes: { type: String, default: "" },

    status: {
      type: String,
      enum: ["beklemede", "onaylandi", "reddedildi"],
      default: "beklemede",
    },
  },
  { timestamps: true }
);

export type SchoolApplicationDoc = InferSchemaType<typeof SchoolApplicationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SchoolApplication =
  mongoose.models.SchoolApplication ??
  mongoose.model("SchoolApplication", SchoolApplicationSchema);

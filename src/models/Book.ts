import mongoose, { Schema, type InferSchemaType } from "mongoose";

const BookSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    publicationDate: { type: Date, default: null },
    publisher: { type: String, default: null },
    pageCount: { type: Number, default: null },
    barcode: { type: String, default: null },
    shelfNumber: { type: String, default: null },
    isAvailable: { type: Boolean, default: true },
    isLost: { type: Boolean, default: false },
    currentLoanId: { type: Schema.Types.ObjectId, ref: "Loan", default: null },
  },
  { timestamps: true }
);

BookSchema.index({ schoolId: 1, isAvailable: 1 });
BookSchema.index({ schoolId: 1, barcode: 1 });
BookSchema.index({ schoolId: 1, shelfNumber: 1 });

export type BookDoc = InferSchemaType<typeof BookSchema> & { _id: mongoose.Types.ObjectId };

export const Book = mongoose.models.Book ?? mongoose.model("Book", BookSchema);

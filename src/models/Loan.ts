import mongoose, { Schema, type InferSchemaType } from "mongoose";

const LoanSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    issuedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    borrowedAt: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date, default: null },
    lostAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "returned", "overdue", "lost"],
      default: "active",
    },
    extensionCount: { type: Number, default: 0, min: 0 },
    extensionHistory: {
      type: [
        {
          at: { type: Date, required: true },
          daysAdded: { type: Number, required: true },
          previousDueDate: { type: Date, required: true },
          newDueDate: { type: Date, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

LoanSchema.index({ schoolId: 1, status: 1 });
LoanSchema.index({ schoolId: 1, borrowedAt: -1 });

export type LoanDoc = InferSchemaType<typeof LoanSchema> & { _id: mongoose.Types.ObjectId };

if (process.env.NODE_ENV !== "production" && mongoose.models.Loan) {
  delete mongoose.models.Loan;
}

export const Loan = mongoose.models.Loan ?? mongoose.model("Loan", LoanSchema);

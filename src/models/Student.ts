import mongoose, { Schema, type InferSchemaType } from "mongoose";

const StudentSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    fullName: { type: String, required: true },
    studentNo: { type: String, default: null },
    gradeClass: { type: String, default: null },
    lostBooksCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

StudentSchema.index({ schoolId: 1, fullName: 1 });

export type StudentDoc = InferSchemaType<typeof StudentSchema> & { _id: mongoose.Types.ObjectId };

export const Student = mongoose.models.Student ?? mongoose.model("Student", StudentSchema);

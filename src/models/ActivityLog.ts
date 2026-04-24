import mongoose, { Schema, type InferSchemaType } from "mongoose";

const ActivityLogSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    role: { type: String, required: true },
    action: { type: String, required: true },
    detail: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ schoolId: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

export type ActivityLogDoc = InferSchemaType<typeof ActivityLogSchema> & { _id: mongoose.Types.ObjectId };

export const ActivityLog =
  mongoose.models.ActivityLog ?? mongoose.model("ActivityLog", ActivityLogSchema);

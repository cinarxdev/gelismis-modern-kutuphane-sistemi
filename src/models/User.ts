import mongoose, { Schema, type InferSchemaType } from "mongoose";

export type UserRole = "super_admin" | "school_admin" | "staff";

const UserSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, default: null },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "school_admin", "staff"],
      required: true,
    },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", default: null },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ schoolId: 1, username: 1 }, { unique: true });

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = mongoose.models.User ?? mongoose.model("User", UserSchema);

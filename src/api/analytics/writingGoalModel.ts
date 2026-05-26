import mongoose, { Schema, Document } from 'mongoose';

export interface IWritingGoal extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'daily' | 'weekly' | 'novel_total';
    targetWords: number;
    novelId?: mongoose.Types.ObjectId; // Only required if type === 'novel_total'
    deadline?: Date; // Optional: "I want to finish this book by December"
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const WritingGoalSchema = new Schema<IWritingGoal>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['daily', 'weekly', 'novel_total'], required: true },
        targetWords: { type: Number, required: true, min: 1 },
        novelId: { type: Schema.Types.ObjectId, ref: 'Document' },
        deadline: { type: Date },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// Index to quickly fetch a user's active goals for the dashboard
WritingGoalSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<IWritingGoal>('WritingGoal', WritingGoalSchema);
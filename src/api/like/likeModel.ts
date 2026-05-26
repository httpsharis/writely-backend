import mongoose, { Schema, Document } from 'mongoose';

export interface ILike extends Document {
    documentId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId; // The reader
    createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
    {
        documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { timestamps: { updatedAt: false } } // We don't need updatedAt for a simple Like
);

// Prevent double-liking at the database level
LikeSchema.index({ documentId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ILike>('Like', LikeSchema);
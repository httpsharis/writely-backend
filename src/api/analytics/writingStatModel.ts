import mongoose, { Schema, Document } from 'mongoose';

export interface IWritingStat extends Document {
    userId: mongoose.Types.ObjectId;
    novelId: mongoose.Types.ObjectId;
    chapterId: mongoose.Types.ObjectId;
    wordCountSnapshot: number; 
    createdAt: Date; 
}

const WritingStatSchema = new Schema<IWritingStat>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        novelId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
        chapterId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
        wordCountSnapshot: { type: Number, required: true, min: 0 }
    },
    { timestamps: { updatedAt: false } } 
);

WritingStatSchema.index({ userId: 1, createdAt: -1 });
WritingStatSchema.index({ userId: 1, novelId: 1, createdAt: -1 });
WritingStatSchema.index({ chapterId: 1, createdAt: -1 });

export default mongoose.model<IWritingStat>('WritingStat', WritingStatSchema);
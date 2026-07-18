import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
    owner: mongoose.Types.ObjectId;
    novelId?: mongoose.Types.ObjectId;
    title: string;
    content: any; // TipTap JSON or plain text
    type: 'lore' | 'plot' | 'worldbuilding' | 'research' | 'timeline' | 'misc';
    createdAt: Date;
    updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        novelId: { type: Schema.Types.ObjectId, ref: 'Document' },
        title: { type: String, required: true, default: 'Untitled Note' },
        content: { type: Schema.Types.Mixed, default: {} },
        type: { 
            type: String, 
            enum: ['lore', 'plot', 'worldbuilding', 'research', 'timeline', 'misc'],
            default: 'misc' 
        }
    },
    { timestamps: true }
);

// Index to instantly fetch and filter notes for a specific novel sidebar
NoteSchema.index({ novelId: 1, type: 1 });

export default mongoose.model<INote>('Note', NoteSchema);
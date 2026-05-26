import Like from './likeModel';
import Document from '../document/documentModel';

export const toggleLike = async (documentId: string, userId: string): Promise<{ isLiked: boolean, likesCount: number }> => {
    // 1. Check if the user already liked this document
    const existingLike = await Like.findOne({ documentId, userId });

    if (existingLike) {
        // 2a. If they did, REMOVE the like and DECREMENT the document's counter
        await Like.findByIdAndDelete(existingLike._id);
        
        const updatedDoc = await Document.findByIdAndUpdate(
            documentId,
            { $inc: { likesCount: -1 } },
            { new: true }
        );
        
        return { isLiked: false, likesCount: updatedDoc?.likesCount || 0 };
    } else {
        // 2b. If they didn't, CREATE the like and INCREMENT the document's counter
        await Like.create({ documentId, userId });
        
        const updatedDoc = await Document.findByIdAndUpdate(
            documentId,
            { $inc: { likesCount: 1 } },
            { new: true }
        );
        
        return { isLiked: true, likesCount: updatedDoc?.likesCount || 0 };
    }
};

export const checkUserLiked = async (documentId: string, userId: string): Promise<boolean> => {
    // This allows the frontend to know if it should paint the heart icon red or gray on page load
    const like = await Like.findOne({ documentId, userId });
    return !!like; 
};
import Document from '../document/documentModel';
import { NotFoundError } from '../../utils/errors';

export const compileNovelForExport = async (novelId: string, userId: string) => {
    // 1. Verify ownership and fetch the main novel document
    const novel = await Document.findOne({ _id: novelId, owner: userId, type: 'novel', deletedAt: null });
    if (!novel) throw new NotFoundError('Novel not found or access denied');

    // 2. Fetch all child chapters, sorted chronologically
    const chapters = await Document.find({ parentId: novelId, type: 'chapter', deletedAt: null })
        .sort({ createdAt: 1 })
        .lean();

    // 3. Stitch the manuscript together
    let compiledText = `# ${novel.title}\n\n`;

    chapters.forEach((chap) => {
        compiledText += `## ${chap.title}\n\n`;
        // If content is empty, provide a fallback.
        compiledText += `${chap.content || '*No content written yet.*'}\n\n`;
        compiledText += `---\n\n`;
    });

    // 4. Clean the title to create a safe file name (e.g., "my_epic_fantasy.md")
    const safeFilename = `${novel.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;

    return {
        filename: safeFilename,
        content: compiledText
    };
};
/**
 * @file exportService.ts
 * @desc Business logic for compiling, parsing, and formatting novels for export.
 */
import Document from "../document/documentModel";
import { NotFoundError } from "../../utils/errors";

interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  [key: string]: unknown;
}

/**
 * @desc Recursively extracts raw text from TipTap/ProseMirror JSON structures.
 * Converts paragraph and heading nodes into text with proper line breaks.
 */
const extractTextFromTipTap = (
  node: TipTapNode | string | null | undefined,
): string => {
  if (!node) return "";
  if (typeof node === "string") return node; // Fallback for raw strings
  if (node.type === "text") return node.text || "";

  // Add line breaks after block elements
  if (node.type === "paragraph" || node.type === "heading") {
    return (node.content?.map(extractTextFromTipTap).join("") || "") + "\n\n";
  }

  // Traverse nested content arrays
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromTipTap).join("");
  }

  return "";
};

export const compileNovelForExport = async (
  novelId: string,
  userId: string,
) => {
  // 1. Verify ownership and fetch the main novel document
  const novel = await Document.findOne({
    _id: novelId,
    owner: userId,
    type: "novel",
    deletedAt: null,
  }).lean();

  if (!novel) throw new NotFoundError("Novel not found or access denied");

  // 2. Fetch all child chapters
  // 🟢 SENIOR FIX: Sort by sequence 'order', falling back to 'createdAt'
  const chapters = await Document.find({
    parentId: novelId,
    type: "chapter",
    deletedAt: null,
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  // 3. Stitch the manuscript together
  let compiledText = `# ${novel.title}\n\n`;

  chapters.forEach((chap) => {
    compiledText += `## ${chap.title}\n\n`;

    // 🟢 SENIOR FIX: Safely extract text from the TipTap JSON
    const rawText = chap.content ? extractTextFromTipTap(chap.content) : "";

    compiledText += rawText.trim()
      ? `${rawText}\n\n`
      : "*No content written yet.*\n\n";
    compiledText += `---\n\n`;
  });

  // 4. Clean the title to create a safe file name (e.g., "my_epic_fantasy.md")
  const safeFilename = `${novel.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;

  return {
    filename: safeFilename,
    content: compiledText,
  };
};

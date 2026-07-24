/**
 * @file searchService.ts
 * @desc Executes highly optimized text-index searches across multiple collections in parallel.
 */
import Document from "../document/documentModel";
import Character from "../character/characterModel";
import Note from "../note/noteModel";

export const executeOmniSearch = async (userId: string, searchTerm: string) => {
  // We execute all three searches in parallel to minimize response time
  const [documents, characters, notes] = await Promise.all([
    // Search Novels and Chapters
    Document.find(
      { owner: userId, deletedAt: null, $text: { $search: searchTerm } },
      { score: { $meta: "textScore" } }, // Fetch relevance score
    )
      .sort({ score: { $meta: "textScore" } }) // Sort by best match
      .select("title type slug updatedAt")
      .limit(5)
      .lean(),

    // Search Characters
    Character.find(
      { userId, $text: { $search: searchTerm } },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .select("name role avatarUrl novelId")
      .limit(5)
      .lean(),

    // Search Notes
    Note.find(
      { owner: userId, $text: { $search: searchTerm } },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .select("title type novelId")
      .limit(5)
      .lean(),
  ]);

  // Format the results into distinct categories for the frontend Command Palette
  return {
    documents,
    characters,
    notes,
    totalResults: documents.length + characters.length + notes.length,
  };
};

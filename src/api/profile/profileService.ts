/**
 * @file profileService.ts
 * @desc Aggregates data for public portfolios and safely handles nested profile updates.
 * STRICT MVP: Follower tracking is disabled. Metrics rely entirely on Views and Likes.
 */
import User from "../user/userModel";
import Document from "../document/documentModel";
import { NotFoundError } from "../../utils/errors";

/**
 * @desc Aggregates the author's identity, stats, and published works.
 */
export const getPublicProfileByUsername = async (username: string) => {
  // 1. Fetch Author's Public Identity (Strictly stripping private data)
  const author = await User.findOne({ username: username.toLowerCase() })
    .select("name username profile createdAt")
    .lean();

  if (!author) {
    throw new NotFoundError("Author profile not found");
  }

  // 2. Fetch all their PUBLISHED novels (No follower lookups!)
  const publishedNovels = await Document.find({
    owner: author._id,
    type: "novel",
    status: "published",
    deletedAt: null,
  })
    .select(
      "title slug coverImage synopsis genre tags viewsCount likesCount updatedAt",
    )
    .sort({ updatedAt: -1 })
    .lean();

  // 3. Calculate total views across all published works in memory
  const totalViews = publishedNovels.reduce(
    (sum, novel) => sum + (novel.viewsCount || 0),
    0,
  );
  const totalLikes = publishedNovels.reduce(
    (sum, novel) => sum + (novel.likesCount || 0),
    0,
  );

  // 4. Return the stitched "Bento Box" payload
  return {
    author: {
      id: author._id,
      name: author.name,
      username: author.username,
      bio: author.profile?.bio || "No bio written yet.",
      avatarUrl: author.profile?.avatarUrl || "",
      website: author.profile?.website || "",
      socialLinks: author.profile?.socialLinks || {},
      joinedAt: author.createdAt,
    },
    stats: {
      totalPublishedNovels: publishedNovels.length,
      totalViews,
      totalLikes, // Added likes as a replacement stat for followers!
    },
    works: publishedNovels,
  };
};

/**
 * @desc Updates the user's profile using MongoDB "dot notation" to safely
 * modify nested fields without overwriting the entire profile object.
 */
export const updateUserProfile = async (userId: string, data: any) => {
  const updatePayload: any = {};

  if (data.name) updatePayload["name"] = data.name;
  if (data.bio !== undefined) updatePayload["profile.bio"] = data.bio;
  if (data.avatarUrl !== undefined)
    updatePayload["profile.avatarUrl"] = data.avatarUrl;
  if (data.website !== undefined)
    updatePayload["profile.website"] = data.website;
  if (data.twitter !== undefined)
    updatePayload["profile.socialLinks.twitter"] = data.twitter;
  if (data.instagram !== undefined)
    updatePayload["profile.socialLinks.instagram"] = data.instagram;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updatePayload },
    { new: true, runValidators: true },
  )
    .select("name username profile")
    .lean();

  if (!updatedUser) {
    throw new NotFoundError("User not found");
  }

  return updatedUser;
};

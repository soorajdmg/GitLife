import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

export class Comment {
  static getCollection() {
    return getDB().collection('comments');
  }

  static async create({ decisionId, authorId, text, parentCommentId = null }) {
    const comment = {
      decisionId,
      authorId,
      parentCommentId,  // null = top-level, string id = reply to a comment
      text: text.slice(0, 500),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await this.getCollection().insertOne(comment);

    // Increment commentCount on the decision
    await getDB().collection('decisions').updateOne(
      { _id: new ObjectId(decisionId) },
      { $inc: { commentCount: 1 } }
    );

    return { id: result.insertedId.toString(), ...comment };
  }

  // Get all comments for a decision, joined with author info
  // Returns top-level comments with their replies nested
  static async findByDecision(decisionId, { limit = 50, currentUserId = null } = {}) {
    const db = getDB();
    const comments = await db.collection('comments').aggregate([
      { $match: { decisionId } },
      { $sort: { createdAt: 1 } },
      { $limit: limit * 5 }, // fetch extra to account for replies
      {
        $lookup: {
          from: 'users',
          let: { aid: '$authorId' },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$aid'] } } },
            { $project: { username: 1, fullName: 1, avatarUrl: 1 } }
          ],
          as: 'author'
        }
      },
      {
        $addFields: {
          id: { $toString: '$_id' },
          author: { $arrayElemAt: ['$author', 0] },
          likeCount: { $size: { $ifNull: ['$likes', []] } },
          likedByMe: currentUserId
            ? { $in: [currentUserId, { $ifNull: ['$likes', []] }] }
            : false,
        }
      },
      {
        $project: {
          _id: 0, id: 1, decisionId: 1, authorId: 1, parentCommentId: 1,
          text: 1, createdAt: 1, updatedAt: 1,
          likeCount: 1, likedByMe: 1,
          'author.username': 1, 'author.fullName': 1, 'author.avatarUrl': 1
        }
      }
    ]).toArray();

    // Nest replies under their parent
    const topLevel = [];
    const replyMap = {};
    comments.forEach(c => {
      if (!c.parentCommentId) {
        topLevel.push({ ...c, replies: [] });
        replyMap[c.id] = topLevel[topLevel.length - 1];
      }
    });
    comments.forEach(c => {
      if (c.parentCommentId && replyMap[c.parentCommentId]) {
        replyMap[c.parentCommentId].replies.push(c);
      }
    });

    return topLevel.slice(0, limit);
  }

  static async delete(id, authorId) {
    const col = this.getCollection();
    const comment = await col.findOne({ _id: new ObjectId(id) });
    if (!comment) return false;
    if (comment.authorId !== authorId) return null; // not owner

    await col.deleteOne({ _id: new ObjectId(id) });
    // Also delete any replies to this comment
    await col.deleteMany({ parentCommentId: id });

    // Decrement commentCount on the decision
    await getDB().collection('decisions').updateOne(
      { _id: new ObjectId(comment.decisionId) },
      { $inc: { commentCount: -1 } }
    );

    return true;
  }

  // Toggle like: adds userId to likes array if not present, removes if present
  static async toggleLike(commentId, userId) {
    const col = this.getCollection();
    const comment = await col.findOne({ _id: new ObjectId(commentId) });
    if (!comment) return null;

    const likes = comment.likes || [];
    const alreadyLiked = likes.includes(userId);

    await col.updateOne(
      { _id: new ObjectId(commentId) },
      alreadyLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } }
    );

    return {
      liked: !alreadyLiked,
      likeCount: alreadyLiked ? likes.length - 1 : likes.length + 1,
    };
  }

  static async createIndexes() {
    await this.getCollection().createIndex({ decisionId: 1, createdAt: 1 });
    await this.getCollection().createIndex({ authorId: 1 });
    await this.getCollection().createIndex({ parentCommentId: 1 });
  }
}

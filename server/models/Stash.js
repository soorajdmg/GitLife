import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

export class Stash {
  static getCollection() {
    return getDB().collection('stashes');
  }

  // Toggle stash: returns { stashed: bool, decisionId }
  static async toggle(userId, decisionId) {
    const col = this.getCollection();
    const existing = await col.findOne({ userId, decisionId });
    if (existing) {
      await col.deleteOne({ userId, decisionId });
      return { stashed: false, decisionId };
    } else {
      await col.insertOne({ userId, decisionId, createdAt: new Date().toISOString() });
      return { stashed: true, decisionId };
    }
  }

  // Get all stashed decision IDs for a user
  static async getStashedIds(userId) {
    const col = this.getCollection();
    const stashes = await col.find({ userId }).toArray();
    return stashes.map(s => s.decisionId);
  }

  // Get full stashed decisions for a user (joined with decisions collection)
  static async getStashedDecisions(userId, { limit = 50 } = {}) {
    const db = getDB();
    const stashes = await db.collection('stashes').aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'decisions',
          let: { did: '$decisionId' },
          pipeline: [
            { $addFields: { id: { $toString: '$_id' } } },
            { $match: { $expr: { $eq: ['$id', '$$did'] } } },
          ],
          as: 'decision'
        }
      },
      { $unwind: '$decision' },
      { $replaceRoot: { newRoot: '$decision' } },
      {
        $lookup: {
          from: 'users',
          let: { uid: '$userId' },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$uid'] } } },
            { $project: { password: 0 } }
          ],
          as: 'userInfo'
        }
      },
      {
        $addFields: { userInfo: { $arrayElemAt: ['$userInfo', 0] } }
      },
      {
        $project: {
          _id: 0, id: 1, decision: 1, branch_name: 1, mood: 1, impact: 1,
          type: 1, body: 1, image: 1, timestamp: 1, createdAt: 1, userId: 1,
          reactions: 1, commentCount: 1, viewCount: 1,
          'userInfo.username': 1, 'userInfo.fullName': 1,
          'userInfo.avatarUrl': 1, 'userInfo._id': 1
        }
      }
    ]).toArray();
    return stashes;
  }

  static async createIndexes() {
    await this.getCollection().createIndex({ userId: 1, decisionId: 1 }, { unique: true });
    await this.getCollection().createIndex({ userId: 1, createdAt: -1 });
  }
}

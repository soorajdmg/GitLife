import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

export class Decision {
  static getCollection() {
    return getDB().collection('decisions');
  }

  static async create(decisionData, userId) {
    const decision = {
      decision: decisionData.decision,
      branch_name: decisionData.branch_name || decisionData.branch,
      mood: decisionData.mood,
      impact: Number(decisionData.impact),
      type: decisionData.type,
      body: decisionData.body || null,
      visibility: decisionData.visibility || 'public',
      image: decisionData.image || null,
      timestamp: decisionData.timestamp || new Date().toISOString(),
      userId: userId,
      createdAt: new Date().toISOString(),
      reactions: {
        fork:    { count: 0, users: [] },
        merge:   { count: 0, users: [] },
        support: { count: 0, users: [] },
      },
      commentCount: 0,
      viewCount: 0,
    };

    const result = await this.getCollection().insertOne(decision);
    return { id: result.insertedId.toString(), ...decision };
  }

  static async findAll(userId, options = {}) {
    const { limit, sortBy = 'timestamp', sortOrder = -1 } = options;

    let query = this.getCollection().find({ userId });

    if (sortBy) {
      query = query.sort({ [sortBy]: sortOrder });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const decisions = await query.toArray();
    return decisions.map(decision => ({
      ...decision,
      id: decision._id.toString(),
      _id: undefined
    }));
  }

  static async findById(id, userId) {
    const decision = await this.getCollection().findOne({
      _id: new ObjectId(id),
      userId
    });
    if (!decision) return null;
    return {
      ...decision,
      id: decision._id.toString(),
      _id: undefined
    };
  }

  static async findByBranch(branchName, userId) {
    const decisions = await this.getCollection()
      .find({ branch_name: branchName, userId })
      .toArray();
    return decisions.map(decision => ({
      ...decision,
      id: decision._id.toString(),
      _id: undefined
    }));
  }

  static async count(userId) {
    return await this.getCollection().countDocuments({ userId });
  }

  static async delete(id, userId) {
    const result = await this.getCollection().deleteOne({
      _id: new ObjectId(id),
      userId
    });
    return result.deletedCount > 0;
  }

  static async toggleReaction(id, userId, type) {
    const col = this.getCollection();
    const decision = await col.findOne({ _id: new ObjectId(id) });
    if (!decision) return null;

    // Ensure reactions structure exists (for old documents)
    const reactionField = `reactions.${type}`;
    const users = decision.reactions?.[type]?.users || [];
    const hasReacted = users.includes(userId);

    if (hasReacted) {
      await col.updateOne({ _id: new ObjectId(id) }, {
        $pull:  { [`reactions.${type}.users`]: userId },
        $inc:   { [`reactions.${type}.count`]: -1 },
      });
    } else {
      await col.updateOne({ _id: new ObjectId(id) }, {
        $addToSet: { [`reactions.${type}.users`]: userId },
        $inc:      { [`reactions.${type}.count`]: 1 },
      });
    }

    const updated = await col.findOne({ _id: new ObjectId(id) });
    return {
      type,
      count: updated.reactions?.[type]?.count ?? 0,
      reacted: !hasReacted,
    };
  }

  static async incrementView(id, viewerId) {
    const col = this.getCollection();
    const decision = await col.findOne({ _id: new ObjectId(id) });
    if (!decision) return null;
    // Don't count own views
    if (decision.userId === viewerId) return decision.viewCount || 0;
    await col.updateOne({ _id: new ObjectId(id) }, { $inc: { viewCount: 1 } });
    return (decision.viewCount || 0) + 1;
  }

  static async createIndexes() {
    // Create index on userId for faster queries
    await this.getCollection().createIndex({ userId: 1 });
    await this.getCollection().createIndex({ branch_name: 1, userId: 1 });
  }
}

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
      timestamp: decisionData.timestamp || new Date().toISOString(),
      userId: userId, // Link decision to user
      createdAt: new Date().toISOString()
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

  static async createIndexes() {
    // Create index on userId for faster queries
    await this.getCollection().createIndex({ userId: 1 });
    await this.getCollection().createIndex({ branch_name: 1, userId: 1 });
  }
}

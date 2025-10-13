import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

export class Branch {
  static getCollection() {
    return getDB().collection('branches');
  }

  static async create(branchData, userId) {
    const branch = {
      name: branchData.name,
      type: branchData.type,
      commits: branchData.commits || 0,
      impact: branchData.impact || 0,
      status: branchData.status || 'catastrophic',
      timestamp: branchData.timestamp || new Date().toISOString(),
      userId: userId, // Link branch to user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await this.getCollection().insertOne(branch);
    return { id: result.insertedId.toString(), ...branch };
  }

  static async findAll(userId) {
    const branches = await this.getCollection()
      .find({ userId })
      .toArray();
    return branches.map(branch => ({
      ...branch,
      id: branch._id.toString(),
      _id: undefined
    }));
  }

  static async findById(id, userId) {
    const branch = await this.getCollection().findOne({
      _id: new ObjectId(id),
      userId
    });
    if (!branch) return null;
    return {
      ...branch,
      id: branch._id.toString(),
      _id: undefined
    };
  }

  static async update(id, userId, updateData) {
    const result = await this.getCollection().updateOne(
      { _id: new ObjectId(id), userId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  static async delete(id, userId) {
    const result = await this.getCollection().deleteOne({
      _id: new ObjectId(id),
      userId
    });
    return result.deletedCount > 0;
  }

  static async updateStats(id, userId, commits, impact) {
    return await this.update(id, userId, { commits, impact });
  }

  static async createIndexes() {
    // Create index on userId for faster queries
    await this.getCollection().createIndex({ userId: 1 });
  }
}

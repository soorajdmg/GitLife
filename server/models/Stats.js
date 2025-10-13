import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

export class Stats {
  static getCollection() {
    return getDB().collection('stats');
  }

  static async get(userId) {
    const stats = await this.getCollection().findOne({ userId });
    if (!stats) {
      // Create default stats if none exist
      const defaultStats = {
        userId: userId,
        impacts: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const result = await this.getCollection().insertOne(defaultStats);
      return { id: result.insertedId.toString(), ...defaultStats };
    }
    return {
      ...stats,
      id: stats._id.toString(),
      _id: undefined
    };
  }

  static async incrementImpact(userId, value) {
    const stats = await this.getCollection().findOne({ userId });

    if (!stats) {
      // Create new stats document
      const newStats = {
        userId: userId,
        impacts: value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const result = await this.getCollection().insertOne(newStats);
      return { id: result.insertedId.toString(), ...newStats };
    }

    // Update existing stats
    const result = await this.getCollection().findOneAndUpdate(
      { _id: stats._id, userId },
      {
        $inc: { impacts: value },
        $set: { updatedAt: new Date().toISOString() }
      },
      { returnDocument: 'after' }
    );

    return {
      ...result,
      id: result._id.toString(),
      _id: undefined
    };
  }

  static async reset(userId) {
    const result = await this.getCollection().updateOne(
      { userId },
      {
        $set: {
          impacts: 0,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }

  static async createIndexes() {
    // Create index on userId for faster queries
    await this.getCollection().createIndex({ userId: 1 }, { unique: true });
  }
}

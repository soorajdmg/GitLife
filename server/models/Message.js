import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

export class Message {
  static getCollection() {
    return getDB().collection('messages');
  }

  static async create({ conversationId, senderId, text, sharedCommit = null }) {
    const doc = {
      conversationId,
      senderId,
      text,
      sharedCommit, // { id, message, branch } or null
      readBy: [senderId], // sender has "read" their own message
      createdAt: new Date().toISOString(),
    };

    const result = await this.getCollection().insertOne(doc);
    return this._format({ ...doc, _id: result.insertedId });
  }

  // Paginated message fetch — newest first, caller reverses for display
  static async findByConversation(conversationId, { limit = 50, before = null } = {}) {
    const query = { conversationId };
    if (before) query.createdAt = { $lt: before };

    const msgs = await this.getCollection()
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return msgs.map(this._format).reverse(); // oldest→newest for UI
  }

  // Mark messages in a conversation as read by userId
  static async markRead(conversationId, userId) {
    await this.getCollection().updateMany(
      { conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
  }

  static async deleteById(id) {
    await this.getCollection().deleteOne({ _id: new ObjectId(id) });
  }

  static _format(msg) {
    return {
      ...msg,
      id: msg._id.toString(),
      _id: undefined,
    };
  }

  static async createIndexes() {
    await this.getCollection().createIndex({ conversationId: 1, createdAt: -1 });
    await this.getCollection().createIndex({ senderId: 1 });
  }
}

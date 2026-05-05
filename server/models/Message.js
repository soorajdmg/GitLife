import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

export class Message {
  static getCollection() {
    return getDB().collection('messages');
  }

  static async create({ conversationId, senderId, text, sharedCommit = null, replyTo = null }) {
    const doc = {
      conversationId,
      senderId,
      text,
      sharedCommit, // { id, message, branch } or null
      replyTo,      // { id, text, senderId } or null — snapshot of parent message
      readBy: [senderId], // sender has "read" their own message
      reactions: {},      // { emoji: [userId, ...] }
      editedAt: null,
      deletedAt: null,    // soft delete
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

  // Full-text search within a conversation
  static async searchInConversation(conversationId, q, limit = 30) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const msgs = await this.getCollection()
      .find({ conversationId, text: regex, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return msgs.map(this._format).reverse();
  }

  // Mark messages in a conversation as read by userId
  static async markRead(conversationId, userId) {
    await this.getCollection().updateMany(
      { conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
  }

  // Soft-delete a single message (only by sender)
  static async softDelete(id, senderId) {
    const result = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id), senderId },
      { $set: { deletedAt: new Date().toISOString(), text: '' } },
      { returnDocument: 'after' }
    );
    return result ? this._format(result) : null;
  }

  // Edit message text (only by sender, within 15 min)
  static async editText(id, senderId, newText) {
    const result = await this.getCollection().findOneAndUpdate(
      { _id: new ObjectId(id), senderId, deletedAt: null },
      { $set: { text: newText, editedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    return result ? this._format(result) : null;
  }

  // Toggle a reaction emoji by a user
  static async toggleReaction(id, userId, emoji) {
    const key = `reactions.${emoji}`;
    const msg = await this.getCollection().findOne({ _id: new ObjectId(id) });
    if (!msg) return null;
    const current = msg.reactions?.[emoji] || [];
    let result;
    if (current.includes(userId)) {
      // Remove
      result = await this.getCollection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $pull: { [key]: userId } },
        { returnDocument: 'after' }
      );
    } else {
      // Add
      result = await this.getCollection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $addToSet: { [key]: userId } },
        { returnDocument: 'after' }
      );
    }
    return result ? this._format(result) : null;
  }

  static async findById(id) {
    const msg = await this.getCollection().findOne({ _id: new ObjectId(id) });
    return msg ? this._format(msg) : null;
  }

  static async deleteById(id) {
    await this.getCollection().deleteOne({ _id: new ObjectId(id) });
  }

  static _format(msg) {
    return {
      ...msg,
      id: msg._id.toString(),
      _id: undefined,
      reactions: msg.reactions || {},
      replyTo: msg.replyTo || null,
      editedAt: msg.editedAt || null,
      deletedAt: msg.deletedAt || null,
    };
  }

  static async createIndexes() {
    await this.getCollection().createIndex({ conversationId: 1, createdAt: -1 });
    await this.getCollection().createIndex({ senderId: 1 });
    await this.getCollection().createIndex({ conversationId: 1, text: 'text' });
  }
}

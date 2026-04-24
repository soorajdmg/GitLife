import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

export class Conversation {
  static getCollection() {
    return getDB().collection('conversations');
  }

  // Get or create a 1-on-1 conversation between two users
  static async getOrCreate(userId1, userId2) {
    const participants = [userId1, userId2].sort(); // canonical order
    let conv = await this.getCollection().findOne({ participants });

    if (!conv) {
      const doc = {
        participants,
        lastMessage: null,
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        // unread counts per user
        unread: { [userId1]: 0, [userId2]: 0 },
      };
      const result = await this.getCollection().insertOne(doc);
      conv = { ...doc, _id: result.insertedId };
    }

    return this._format(conv);
  }

  // Get all conversations for a user, sorted by latest message
  static async findByUser(userId) {
    const convs = await this.getCollection()
      .find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .toArray();
    return convs.map(this._format);
  }

  static async findById(id) {
    const conv = await this.getCollection().findOne({ _id: new ObjectId(id) });
    return conv ? this._format(conv) : null;
  }

  // Update last message preview + unread count for the OTHER participant
  static async updateLastMessage(id, senderId, text, participants) {
    const recipientId = participants.find(p => p !== senderId);
    await this.getCollection().updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastMessage: { senderId, text, sentAt: new Date().toISOString() },
          lastMessageAt: new Date().toISOString(),
        },
        $inc: { [`unread.${recipientId}`]: 1 },
      }
    );
  }

  // Mark all messages in this conversation as read for userId
  static async markRead(id, userId) {
    await this.getCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: { [`unread.${userId}`]: 0 } }
    );
  }

  static _format(conv) {
    return {
      ...conv,
      id: conv._id.toString(),
      _id: undefined,
    };
  }

  static async createIndexes() {
    await this.getCollection().createIndex({ participants: 1 });
    await this.getCollection().createIndex({ lastMessageAt: -1 });
  }
}

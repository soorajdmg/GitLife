import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

export class Notification {
  static getCollection() {
    return getDB().collection('notifications');
  }

  /**
   * Create a notification.
   * @param {object} data
   *   recipientId  - user who receives the notif
   *   senderId     - user who triggered it
   *   type         - 'follow' | 'fork' | 'merge' | 'support' | 'comment' | 'reply'
   *   decisionId   - (optional) related decision id
   *   decisionText - (optional) short preview of the decision
   *   commentText  - (optional) short preview of the comment
   */
  static async create({ recipientId, senderId, type, decisionId = null, decisionText = null, commentText = null }) {
    // Don't notify yourself
    if (recipientId === senderId) return null;

    const notif = {
      recipientId,
      senderId,
      type,
      decisionId,
      decisionText: decisionText ? decisionText.slice(0, 120) : null,
      commentText:  commentText  ? commentText.slice(0, 120)  : null,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const result = await this.getCollection().insertOne(notif);
    return { id: result.insertedId.toString(), ...notif };
  }

  /** Get notifications for a recipient, most recent first. */
  static async findByRecipient(recipientId, { limit = 50 } = {}) {
    const db = getDB();
    const notifs = await db.collection('notifications').aggregate([
      { $match: { recipientId } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          let: { sid: '$senderId' },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$sid'] } } },
            { $project: { username: 1, fullName: 1, avatarUrl: 1 } }
          ],
          as: 'sender'
        }
      },
      {
        $addFields: {
          id: { $toString: '$_id' },
          sender: { $arrayElemAt: ['$sender', 0] }
        }
      },
      {
        $project: {
          _id: 0, id: 1, recipientId: 1, senderId: 1, type: 1,
          decisionId: 1, decisionText: 1, commentText: 1,
          read: 1, createdAt: 1,
          'sender.username': 1, 'sender.fullName': 1, 'sender.avatarUrl': 1
        }
      }
    ]).toArray();

    return notifs;
  }

  /** Count unread notifications for a recipient. */
  static async countUnread(recipientId) {
    return this.getCollection().countDocuments({ recipientId, read: false });
  }

  /** Mark one notification as read. */
  static async markRead(id, recipientId) {
    await this.getCollection().updateOne(
      { _id: new ObjectId(id), recipientId },
      { $set: { read: true } }
    );
  }

  /** Mark all notifications for a recipient as read. */
  static async markAllRead(recipientId) {
    await this.getCollection().updateMany(
      { recipientId, read: false },
      { $set: { read: true } }
    );
  }

  static async createIndexes() {
    const col = this.getCollection();
    await col.createIndex({ recipientId: 1, createdAt: -1 });
    await col.createIndex({ recipientId: 1, read: 1 });
  }
}

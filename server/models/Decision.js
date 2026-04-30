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
      influencedBy: decisionData.influencedBy || [],
      forkedFrom: decisionData.forkedFrom || null,
      mergedWith: [],
      blameStatus: null,
      blameNote: null,
      dependentCount: 0,
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

  static async findForGraph(userId) {
    const decisions = await this.getCollection()
      .find({ userId }, {
        projection: {
          decision: 1, branch_name: 1, type: 1, impact: 1, timestamp: 1,
          blameStatus: 1, blameNote: 1, dependentCount: 1, influencedBy: 1,
          createdAt: 1,
        }
      })
      .sort({ createdAt: 1, _id: 1 })
      .toArray();
    return decisions.map(d => {
      // Sanitize influencedBy — ensure it's always a valid array of objects
      const rawLinks = Array.isArray(d.influencedBy) ? d.influencedBy : [];
      const influencedBy = rawLinks.filter(
        e => e && typeof e === 'object' && typeof e.decisionId === 'string' && e.decisionId.length > 0
      );
      return {
        id: d._id.toString(),
        decision: d.decision || '',
        branch_name: d.branch_name || 'main',
        type: d.type || null,
        impact: d.impact ?? null,
        timestamp: d.timestamp || d.createdAt || null,
        blameStatus: d.blameStatus || null,
        blameNote: d.blameNote || null,
        dependentCount: d.dependentCount || 0,
        influencedBy,
      };
    });
  }

  static async updateLinks(id, userId, toAdd = [], toRemove = []) {
    const col = this.getCollection();
    const oid = new ObjectId(id);

    // Verify ownership
    const decision = await col.findOne({ _id: oid, userId });
    if (!decision) return null;

    const existing = decision.influencedBy || [];

    // Remove entries
    let updated = existing.filter(e => !toRemove.includes(e.decisionId));

    // Add entries (avoid duplicates)
    for (const entry of toAdd) {
      if (!updated.find(e => e.decisionId === entry.decisionId)) {
        updated.push({ decisionId: entry.decisionId, note: entry.note || '' });
      }
    }

    await col.updateOne({ _id: oid }, { $set: { influencedBy: updated } });

    // Update dependentCount on referenced decisions
    for (const entry of toAdd) {
      try {
        await col.updateOne(
          { _id: new ObjectId(entry.decisionId) },
          { $inc: { dependentCount: 1 } }
        );
      } catch (_) {}
    }
    for (const removedId of toRemove) {
      try {
        await col.updateOne(
          { _id: new ObjectId(removedId) },
          { $inc: { dependentCount: -1 } }
        );
      } catch (_) {}
    }

    const result = await col.findOne({ _id: oid });
    return { ...result, id: result._id.toString(), _id: undefined };
  }

  static async setBlameStatus(id, userId, status, note = null) {
    const col = this.getCollection();
    const oid = new ObjectId(id);
    const decision = await col.findOne({ _id: oid, userId });
    if (!decision) return null;
    await col.updateOne({ _id: oid }, {
      $set: { blameStatus: status || null, blameNote: note || null }
    });
    return { id, blameStatus: status || null, blameNote: note || null };
  }

  static async getBlameChain(id, userId, maxDepth = 10) {
    const col = this.getCollection();

    const rootDoc = await col.findOne({ _id: new ObjectId(id), userId });
    if (!rootDoc) return null;

    const root = { ...rootDoc, id: rootDoc._id.toString(), _id: undefined };
    const ancestors = [];
    const visited = new Set([id]);
    const queue = [...(root.influencedBy || []).map(e => e.decisionId)];
    let depth = 0;

    while (queue.length > 0 && depth < maxDepth) {
      const nextQueue = [];
      for (const decisionId of queue) {
        if (visited.has(decisionId)) continue;
        visited.add(decisionId);
        try {
          const doc = await col.findOne({ _id: new ObjectId(decisionId) });
          if (!doc) continue;
          const node = { ...doc, id: doc._id.toString(), _id: undefined };
          ancestors.push(node);
          for (const e of (node.influencedBy || [])) {
            if (!visited.has(e.decisionId)) nextQueue.push(e.decisionId);
          }
        } catch (_) {}
      }
      queue.length = 0;
      queue.push(...nextQueue);
      depth++;
    }

    return { root, ancestors, depth };
  }

  static async mergeDecision(originalId, myDecisionId, mergerUserId, mergerUsername) {
    const col = this.getCollection();
    const originalOid = new ObjectId(originalId);
    const myOid = new ObjectId(myDecisionId);

    const [original, mine] = await Promise.all([
      col.findOne({ _id: originalOid }),
      col.findOne({ _id: myOid, userId: mergerUserId }),
    ]);

    if (!original) return null;
    if (!mine) return null; // must own myDecisionId
    if (original.userId === mergerUserId) return null; // can't merge own commit

    const alreadyMerged = (original.reactions?.merge?.users || []).includes(mergerUserId);

    if (alreadyMerged) {
      // Un-merge: remove links from both, decrement count
      await Promise.all([
        col.updateOne({ _id: originalOid }, {
          $pull: { mergedWith: { userId: mergerUserId }, 'reactions.merge.users': mergerUserId },
          $inc: { 'reactions.merge.count': -1 },
        }),
        col.updateOne({ _id: myOid }, {
          $pull: { mergedWith: { decisionId: originalId } },
        }),
      ]);
      const updated = await col.findOne({ _id: originalOid });
      return { merged: false, count: updated.reactions?.merge?.count ?? 0 };
    } else {
      // Merge: link both decisions
      await Promise.all([
        col.updateOne({ _id: originalOid }, {
          $addToSet: {
            mergedWith: { decisionId: myDecisionId, userId: mergerUserId, username: mergerUsername },
            'reactions.merge.users': mergerUserId,
          },
          $inc: { 'reactions.merge.count': 1 },
        }),
        col.updateOne({ _id: myOid }, {
          $addToSet: {
            mergedWith: { decisionId: originalId, userId: original.userId, username: original.username },
          },
        }),
      ]);
      const updated = await col.findOne({ _id: originalOid });
      return { merged: true, count: updated.reactions?.merge?.count ?? 0 };
    }
  }

  static async createIndexes() {
    // Create index on userId for faster queries
    await this.getCollection().createIndex({ userId: 1 });
    await this.getCollection().createIndex({ branch_name: 1, userId: 1 });
    await this.getCollection().createIndex({ 'influencedBy.decisionId': 1 });
    await this.getCollection().createIndex({ blameStatus: 1, userId: 1 });
    await this.getCollection().createIndex({ dependentCount: -1, userId: 1 });
  }
}

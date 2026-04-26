import express from 'express';
import { getDB } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { Notification } from '../models/Notification.js';

const router = express.Router();

// GET /explore - public feed of all users' decisions, joined with user info
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { limit = 50, type, search, userId } = req.query;

    const matchStage = {};

    if (type === 'whatifs') {
      matchStage.branch_name = { $regex: '^what-if/', $options: 'i' };
    }

    if (search && search.trim()) {
      matchStage.decision = { $regex: search.trim(), $options: 'i' };
    }

    if (userId && userId.trim()) {
      matchStage.userId = userId.trim();
    }

    const decisions = await db.collection('decisions').aggregate([
      { $match: matchStage },
      {
        $addFields: {
          totalReactions: {
            $add: [
              { $ifNull: ['$reactions.fork.count', 0] },
              { $ifNull: ['$reactions.merge.count', 0] },
              { $ifNull: ['$reactions.support.count', 0] },
            ]
          },
          hoursAge: {
            $divide: [
              { $subtract: [new Date(), { $toDate: '$createdAt' }] },
              3600000
            ]
          }
        }
      },
      {
        $addFields: {
          trendScore: {
            $divide: [
              { $add: ['$totalReactions', 1] },
              { $pow: [{ $add: ['$hoursAge', 2] }, 1.5] }
            ]
          }
        }
      },
      { $sort: { trendScore: -1 } },
      { $limit: parseInt(limit) },
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
        $addFields: {
          id: { $toString: '$_id' },
          userInfo: { $arrayElemAt: ['$userInfo', 0] }
        }
      },
      {
        $addFields: {
          userReactions: {
            fork:    { $in: [req.user?.userId || '', { $ifNull: ['$reactions.fork.users', []] }] },
            merge:   { $in: [req.user?.userId || '', { $ifNull: ['$reactions.merge.users', []] }] },
            support: { $in: [req.user?.userId || '', { $ifNull: ['$reactions.support.users', []] }] },
          }
        }
      },
      {
        $project: {
          _id: 0, id: 1, decision: 1, branch_name: 1, mood: 1, impact: 1,
          type: 1, body: 1, image: 1, timestamp: 1, createdAt: 1, userId: 1,
          reactions: 1, commentCount: 1, userReactions: 1,
          'userInfo.username': 1, 'userInfo.fullName': 1,
          'userInfo.avatarUrl': 1, 'userInfo._id': 1
        }
      }
    ]).toArray();

    res.json(decisions);
  } catch (error) {
    console.error('Error fetching explore feed:', error);
    res.status(500).json({ error: 'Failed to fetch explore feed' });
  }
});

// GET /explore/feed - following feed, then trending posts
// Query params: seenIds (comma-separated), limit
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const currentUserId = req.user.userId || req.user.id || req.user._id?.toString();
    const limit = parseInt(req.query.limit) || 30;
    const seenIds = req.query.seenIds ? req.query.seenIds.split(',').filter(Boolean) : [];

    // Get who the current user follows
    const me = await db.collection('users').findOne(
      { $expr: { $eq: [{ $toString: '$_id' }, currentUserId] } },
      { projection: { following: 1 } }
    );
    const followingIds = me?.following || [];

    // Pipeline to join with user info
    const userLookup = [
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
        $addFields: {
          id: { $toString: '$_id' },
          userInfo: { $arrayElemAt: ['$userInfo', 0] },
          userReactions: {
            fork:    { $in: [currentUserId, { $ifNull: ['$reactions.fork.users', []] }] },
            merge:   { $in: [currentUserId, { $ifNull: ['$reactions.merge.users', []] }] },
            support: { $in: [currentUserId, { $ifNull: ['$reactions.support.users', []] }] },
          }
        }
      },
      {
        $project: {
          _id: 0, id: 1, decision: 1, branch_name: 1, mood: 1, impact: 1,
          type: 1, timestamp: 1, createdAt: 1, userId: 1, body: 1, visibility: 1,
          image: 1, reactions: 1, commentCount: 1, userReactions: 1,
          'userInfo.username': 1, 'userInfo.fullName': 1,
          'userInfo.avatarUrl': 1, 'userInfo._id': 1
        }
      }
    ];

    // 1. Following feed: posts from people I follow (excluding seen)
    // Convert seenIds to ObjectIds where valid, filter by string id via addFields
    const followingPosts = followingIds.length > 0
      ? await db.collection('decisions').aggregate([
          { $addFields: { id: { $toString: '$_id' } } },
          { $match: { userId: { $in: followingIds }, id: { $nin: seenIds } } },
          { $sort: { createdAt: -1 } },
          { $limit: limit },
          ...userLookup
        ]).toArray()
      : [];

    // 2. Trending posts: time-decayed engagement score, from all users except current user, excluding seen + already returned following posts
    // trendScore = totalReactions / (hoursAge + 2)^1.5  (similar to HN ranking)
    const allSeenIds = [...seenIds, ...followingPosts.map(p => p.id)];
    const trendingMatch = {
      userId: { $ne: currentUserId },
      visibility: { $ne: 'private' }
    };
    const trendingPosts = await db.collection('decisions').aggregate([
      { $addFields: { id: { $toString: '$_id' } } },
      { $match: { ...trendingMatch, id: { $nin: allSeenIds } } },
      {
        $addFields: {
          totalReactions: {
            $add: [
              { $ifNull: ['$reactions.fork.count', 0] },
              { $ifNull: ['$reactions.merge.count', 0] },
              { $ifNull: ['$reactions.support.count', 0] },
            ]
          },
          hoursAge: {
            $divide: [
              { $subtract: [new Date(), { $toDate: '$createdAt' }] },
              3600000 // ms per hour
            ]
          }
        }
      },
      {
        $addFields: {
          trendScore: {
            $divide: [
              { $add: ['$totalReactions', 1] },
              { $pow: [{ $add: ['$hoursAge', 2] }, 1.5] }
            ]
          }
        }
      },
      { $sort: { trendScore: -1 } },
      { $limit: limit },
      ...userLookup
    ]).toArray();

    res.json({
      following: followingPosts,
      trending: trendingPosts,
      hasFollowing: followingIds.length > 0,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// GET /explore/suggested - suggested users: mutual-first, then popular, then available
// Returns users with isFollowing flag so the UI knows current follow state
router.get('/suggested', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { limit = 12 } = req.query;
    const currentUserId = req.user.userId || req.user.id || req.user._id?.toString();

    // Get current user's following list
    const me = await db.collection('users').findOne(
      { $expr: { $eq: [{ $toString: '$_id' }, currentUserId] } },
      { projection: { following: 1 } }
    );
    const myFollowing = me?.following || []; // array of user id strings

    // Get all other users
    const users = await db.collection('users').aggregate([
      { $addFields: { id: { $toString: '$_id' } } },
      { $match: { id: { $ne: currentUserId } } },
      { $project: { _id: 0, id: 1, username: 1, fullName: 1, avatarUrl: 1, following: 1 } }
    ]).toArray();

    // Get commit counts for all users
    const userIds = users.map(u => u.id);
    const counts = await db.collection('decisions').aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]).toArray();
    const countMap = {};
    counts.forEach(c => { countMap[c._id] = c.count; });

    // Build result with scoring:
    // - mutual (they follow someone I follow): +1000
    // - already following: deprioritize (shown as Following, not hidden)
    // - commit count: raw value as tiebreaker
    const result = users.map(u => {
      const theirFollowing = u.following || [];
      const mutualCount = theirFollowing.filter(id => myFollowing.includes(id)).length;
      const commitCount = countMap[u.id] || 0;
      const isFollowing = myFollowing.includes(u.id);
      // Score: mutual people > popular > everyone else; already-following goes last
      const score = isFollowing ? -1 : (mutualCount * 1000 + commitCount);
      return { id: u.id, username: u.username, fullName: u.fullName, avatarUrl: u.avatarUrl, commitCount, mutualCount, isFollowing, score };
    });

    result.sort((a, b) => b.score - a.score);

    res.json(result.slice(0, parseInt(limit)));
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    res.status(500).json({ error: 'Failed to fetch suggested users' });
  }
});

// GET /explore/following - get list of users the current user follows
router.get('/following', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const currentUserId = req.user.userId || req.user.id || req.user._id?.toString();

    const me = await db.collection('users').findOne(
      { $expr: { $eq: [{ $toString: '$_id' }, currentUserId] } },
      { projection: { following: 1 } }
    );
    const followingIds = me?.following || [];

    if (followingIds.length === 0) return res.json([]);

    const users = await db.collection('users').aggregate([
      { $addFields: { id: { $toString: '$_id' } } },
      { $match: { id: { $in: followingIds } } },
      { $project: { _id: 0, id: 1, username: 1, fullName: 1, avatarUrl: 1 } }
    ]).toArray();

    res.json(users);
  } catch (error) {
    console.error('Error fetching following list:', error);
    res.status(500).json({ error: 'Failed to fetch following list' });
  }
});

// POST /explore/follow/:userId - follow a user
router.post('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const currentUserId = req.user.userId || req.user.id || req.user._id?.toString();
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Add targetUserId to current user's following array (no duplicates)
    await db.collection('users').updateOne(
      { $expr: { $eq: [{ $toString: '$_id' }, currentUserId] } },
      { $addToSet: { following: targetUserId } }
    );

    // Add currentUserId to target user's followers array
    await db.collection('users').updateOne(
      { $expr: { $eq: [{ $toString: '$_id' }, targetUserId] } },
      { $addToSet: { followers: currentUserId } }
    );

    // Notify the target user
    Notification.create({ recipientId: targetUserId, senderId: currentUserId, type: 'follow' }).catch(() => {});

    res.json({ success: true, following: true });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// DELETE /explore/follow/:userId - unfollow a user
router.delete('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const currentUserId = req.user.userId || req.user.id || req.user._id?.toString();
    const targetUserId = req.params.userId;

    await db.collection('users').updateOne(
      { $expr: { $eq: [{ $toString: '$_id' }, currentUserId] } },
      { $pull: { following: targetUserId } }
    );

    await db.collection('users').updateOne(
      { $expr: { $eq: [{ $toString: '$_id' }, targetUserId] } },
      { $pull: { followers: currentUserId } }
    );

    res.json({ success: true, following: false });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// GET /explore/users/:userId - get a single user's public profile
router.get('/users/:userId', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    const currentUserId = req.user.userId || req.user.id || req.user._id?.toString();

    const user = await db.collection('users').aggregate([
      { $addFields: { id: { $toString: '$_id' } } },
      { $match: { id: userId } },
      { $project: { _id: 0, id: 1, username: 1, fullName: 1, avatarUrl: 1, followers: 1 } }
    ]).next();

    if (!user) return res.status(404).json({ error: 'User not found' });

    const commitCount = await db.collection('decisions').countDocuments({ userId });
    const isFollowing = (user.followers || []).includes(currentUserId);

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      commitCount,
      followerCount: (user.followers || []).length,
      isFollowing,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /explore/users - search users by username or fullName
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { search = '', limit = 20 } = req.query;

    const matchStage = search.trim()
      ? {
          $or: [
            { username: { $regex: search.trim(), $options: 'i' } },
            { fullName: { $regex: search.trim(), $options: 'i' } }
          ]
        }
      : {};

    const users = await db.collection('users').aggregate([
      { $match: matchStage },
      { $limit: parseInt(limit) },
      {
        $addFields: { id: { $toString: '$_id' } }
      },
      {
        $project: { _id: 0, id: 1, username: 1, fullName: 1, avatarUrl: 1, createdAt: 1 }
      }
    ]).toArray();

    const userIds = users.map(u => u.id);
    const counts = await db.collection('decisions').aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]).toArray();

    const countMap = {};
    counts.forEach(c => { countMap[c._id] = c.count; });

    res.json(users.map(u => ({ ...u, commitCount: countMap[u.id] || 0 })));
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;

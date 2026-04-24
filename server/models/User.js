import { getDB } from '../config/database.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export class User {
  static getCollection() {
    return getDB().collection('users');
  }

  static async create(userData) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = {
      email: userData.email.toLowerCase().trim(),
      username: userData.username.trim(),
      fullName: userData.fullName ? userData.fullName.trim() : '',
      password: hashedPassword,
      avatarUrl: userData.avatarUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await this.getCollection().insertOne(user);

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return {
      id: result.insertedId.toString(),
      ...userWithoutPassword
    };
  }

  static async createOAuth(userData) {
    const user = {
      email: userData.email.toLowerCase().trim(),
      username: userData.username.trim(),
      fullName: userData.fullName ? userData.fullName.trim() : '',
      password: null,
      avatarUrl: userData.avatarUrl || null,
      googleId: userData.googleId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await this.getCollection().insertOne(user);
    const { password, ...userWithoutPassword } = user;
    return {
      id: result.insertedId.toString(),
      ...userWithoutPassword
    };
  }

  static async findByEmail(email) {
    const user = await this.getCollection().findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) return null;

    return {
      ...user,
      id: user._id.toString(),
      _id: undefined
    };
  }

  static async findByUsername(username) {
    const user = await this.getCollection().findOne({
      username: username.trim()
    });

    if (!user) return null;

    return {
      ...user,
      id: user._id.toString(),
      _id: undefined
    };
  }

  static async findById(id) {
    const user = await this.getCollection().findOne({
      _id: new ObjectId(id)
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      id: user._id.toString(),
      _id: undefined
    };
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(id) {
    await this.getCollection().updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    );
  }

  static async update(id, updateData) {
    const result = await this.getCollection().updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      }
    );
    return result.modifiedCount > 0;
  }

  static async delete(id) {
    const result = await this.getCollection().deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  }

  static async createIndexes() {
    // Create unique indexes for email and username
    await this.getCollection().createIndex({ email: 1 }, { unique: true });
    await this.getCollection().createIndex({ username: 1 }, { unique: true });
  }
}

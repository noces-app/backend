import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  /**
   * Create a new user or update if exists by keycloakId
   */
  async createOrUpdateUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    keycloakId: string;
  }): Promise<User> {
    // Check if user with this keycloakId already exists
    const existingUser = await this.userModel.findOne({
      keycloakId: userData.keycloakId,
    });

    if (existingUser) {
      // Update existing user
      existingUser.email = userData.email;
      existingUser.firstName = userData.firstName;
      existingUser.lastName = userData.lastName;
      existingUser.roles = userData.roles;
      return existingUser.save();
    }

    // Check if user with this email exists but without keycloakId
    const existingUserByEmail = await this.userModel.findOne({
      email: userData.email,
      keycloakId: { $exists: false },
    });

    if (existingUserByEmail) {
      // Update existing user with keycloakId
      existingUserByEmail.keycloakId = userData.keycloakId;
      existingUserByEmail.firstName = userData.firstName;
      existingUserByEmail.lastName = userData.lastName;
      existingUserByEmail.roles = userData.roles;
      return existingUserByEmail.save();
    }

    // Create new user
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Find user by Keycloak ID
   */
  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    return this.userModel.findOne({ keycloakId }).exec();
  }
}

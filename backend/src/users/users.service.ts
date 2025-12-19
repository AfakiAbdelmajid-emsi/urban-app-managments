import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async createUser(data: Partial<User>): Promise<UserDocument> {
    const newUser = new this.userModel(data);
    return newUser.save();
  }

  async getUser(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { hashPassword, comparePassword } from '../utils/bcrypt.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ access_token: string; userId: string }> {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new UnauthorizedException('Email already used');
    }

    const hashedPassword = await hashPassword(dto.password);

    const createdUser = await this.usersService.createUser({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
    });

    // Generate token for immediate login after registration
    const access_token = this.jwtService.sign({
      id: createdUser._id.toString(),
    });

    return {
      access_token,
      userId: createdUser._id,
    };
  }

  async login(dto: LoginDto): Promise<{ access_token: string; userId: string }> {
    const user: UserDocument | null = await this.usersService.findByEmail(
      dto.email,
    );
    
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await comparePassword(dto.password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const access_token = this.jwtService.sign({
      id: user._id.toString(),
    });

    return {
      access_token,
      userId: user._id,
    };
  }
}

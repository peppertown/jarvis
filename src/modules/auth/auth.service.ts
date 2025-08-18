import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  UserAlreadyExistsException,
  InvalidCredentialsException,
} from '../../common/exceptions/user.exception';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, nickname } = registerDto;

    // 이메일 중복 체크
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UserAlreadyExistsException(email);
    }

    // 비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
      },
    });

    // 비밀번호 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 사용자 찾기
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new InvalidCredentialsException();
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // JWT 토큰 생성
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

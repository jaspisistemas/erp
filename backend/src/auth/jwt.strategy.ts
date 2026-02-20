import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('access_token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.prfGamId) {
      return payload;
    }
    const user = await this.prisma.pessoa.findFirst({
      where: {
        PesCod: payload.sub,
        EmpCod: payload.empCod,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return payload;
  }
}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { ModulesModule } from '../modules/modules.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

const jwtSecret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
const jwtTtl = process.env.JWT_ACCESS_TTL || '8h';

@Module({
	imports: [
		PrismaModule,
		ModulesModule,
		PassportModule,
		JwtModule.register({
			secret: jwtSecret,
			signOptions: { expiresIn: jwtTtl as any },
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy],
	exports: [AuthService],
})
export class AuthModule {}

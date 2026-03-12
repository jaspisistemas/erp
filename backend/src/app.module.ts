import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
// import { ModulesModule } from './modules/modules.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, MenuModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

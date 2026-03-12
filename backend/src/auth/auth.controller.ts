import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SelectCompanyDto } from './dto/select-company.dto';
// import { SelectModuleDto } from './dto/select-module.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.auth.login({ user: dto.user }, dto.password);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken, dto.activeModuleId);
  }

  // @Post('select-module')
  // @UseGuards(JwtAuthGuard)
  // async selectModule(
  //   @Body() dto: SelectModuleDto,
  //   @Req() req: Request & { user: JwtPayload },
  // ) {
  //   return this.auth.selectModule(req.user, dto.moduleId ?? '');
  // }

  @Get('empresas-com-acesso')
  @UseGuards(JwtAuthGuard)
  async getEmpresasComAcesso(@Req() req: Request & { user: JwtPayload }) {
    return this.auth.getEmpresasComAcesso(req.user);
  }

  @Post('select-company')
  @UseGuards(JwtAuthGuard)
  async selectCompany(
    @Body() dto: SelectCompanyDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.auth.selectCompany(req.user, dto.empCod);
  }
}

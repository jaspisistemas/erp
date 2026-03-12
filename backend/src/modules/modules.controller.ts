// import { Controller, Get, Req, UseGuards } from '@nestjs/common';
// import { Request } from 'express';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
// import { ModulesService, ModuloDto } from './modules.service';

// @Controller('modules')
// export class ModulesController {
//   constructor(private modules: ModulesService) {}

//   @Get()
//   @UseGuards(JwtAuthGuard)
//   async list(@Req() req: Request & { user: JwtPayload }): Promise<ModuloDto[]> {
//     return this.modules.getModulesForUser(req.user);
//   }
// }

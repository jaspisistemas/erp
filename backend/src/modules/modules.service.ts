// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

// export interface ModuloDto {
//   modCod: string;
//   modNom: string | null;
//   modIconClass: string | null;
//   modLin: string | null;
//   modCaption: string | null;
//   modOrd: number | null;
// }

// @Injectable()
// export class ModulesService {
//   constructor(private prisma: PrismaService) {}

//   async getModulesForUser(_payload: JwtPayload): Promise<ModuloDto[]> {
//     return [];
//   }
// }
// // 
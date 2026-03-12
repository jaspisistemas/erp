import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// function hashPassword(userGuid: string, password: string): string {
//   return createHash('sha512').update(userGuid + password, 'utf8').digest('base64');
// }

async function main() {
  // await prisma.empresa.upsert({
  //   where: { EmpCod: 1 },
  //   update: {},
  //   create: { EmpCod: 1, EmpRaz: 'Empresa Demo', EmpCodNom: 'EMPDEM' },
  // });

  // const userGuid = 'admin-user-guid';
  // await prisma.usuario.upsert({
  //   where: { UserGuid: userGuid },
  //   update: {
  //     UserSen: hashPassword(userGuid, 'admin123'),
  //   },
  //   create: {
  //     UserGuid: userGuid,
  //     UserNam: 'admin',
  //     UserNom: 'Administrador',
  //     UserEml: 'admin@empresa.com',
  //     UserSen: hashPassword(userGuid, 'admin123'),
  //     UserPesExtCod: 1,
  //   },
  // });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
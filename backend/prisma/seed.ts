import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.empresa.upsert({
    where: { EmpCod: 1 },
    update: {},
    create: { EmpCod: 1, EmpRaz: 'Empresa Demo' },
  });

  const hash = await bcrypt.hash('admin', 10);
  const existing = await prisma.pessoa.findUnique({
    where: { EmpCod_PesCod: { EmpCod: 1, PesCod: 1 } },
  });
  if (!existing) {
    await prisma.pessoa.create({
      data: {
        EmpCod: 1,
        PesCod: 1,
        PesUsr: 'admin',
        PesPassHash: hash,
        PesNom: 'Administrador',
        PesEml1: 'admin@demo.local',
      },
    });
  }

  await prisma.modulo.upsert({
    where: { ModCod: 'rpa' },
    update: {},
    create: {
      ModCod: 'rpa',
      ModNom: 'Módulo RPA',
      ModCaption: 'RPA',
      ModLin: '/dashboard',
      ModOrd: 1,
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

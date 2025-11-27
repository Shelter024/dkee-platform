import { prisma } from '../src/lib/prisma';
import crypto from 'crypto';

function fakeEmail(i: number) { return `user${i}@example.invalid`; }
function fakePhone(i: number) { return `+1555000${(1000 + i).toString().slice(-4)}`; }
function fakeName(i: number) { return `User ${i}`; }
function hashStable(input: string) { return crypto.createHash('sha256').update(input).digest('hex').slice(0,12); }

async function main() {
  const users = await prisma.user.findMany({});
  let i = 0;
  for (const u of users) {
    if (u.role === 'CUSTOMER' || u.role?.toString().includes('STAFF') || u.role === 'ADMIN' || u.role === 'CEO' || u.role === 'MANAGER') {
      // Preserve roles but anonymize PII
      await prisma.user.update({
        where: { id: u.id },
        data: {
          name: fakeName(i),
          email: fakeEmail(i),
          phone: fakePhone(i),
        },
      });
      i++;
    }
  }

  // Obfuscate messages content
  try {
    const messages: any[] = await (prisma as any).message.findMany({});
    for (const m of messages) {
      await (prisma as any).message.update({
        where: { id: m.id },
        data: {
          subject: `Subject ${hashStable(String(m.id))}`,
          body: 'Redacted for staging.',
        },
      });
    }
  } catch {}

  // Obfuscate property titles & descriptions
  try {
    const properties = await prisma.property.findMany({});
    for (const p of properties) {
      await prisma.property.update({
        where: { id: p.id },
        data: {
          title: `Property ${hashStable(p.id)}`,
          description: 'Redacted for staging environment.',
        },
      });
    }
  } catch {}

  // Emergency requests message/location redact
  try {
    const emergencies = await prisma.emergencyRequest.findMany({});
    for (const e of emergencies) {
      await prisma.emergencyRequest.update({
        where: { id: e.id },
        data: {
          title: `Emergency ${hashStable(e.id)}`,
          location: 'Redacted',
        },
      });
    }
  } catch {}

  console.log('Anonymization complete');
}

main().catch(e => { console.error(e); process.exit(1); });
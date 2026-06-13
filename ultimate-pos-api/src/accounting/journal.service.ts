import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async createJournalEntry(businessId: number, userId: number, dto: CreateJournalEntryDto) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Journal entry must have at least one line');
    }

    // Verify all accounts exist and belong to this business
    const accountIds = dto.lines.map((line) => line.accountId);
    const uniqueAccountIds = [...new Set(accountIds)];

    const accounts = await this.prisma.account.findMany({
      where: {
        id: { in: uniqueAccountIds },
        businessId,
      },
    });

    if (accounts.length !== uniqueAccountIds.length) {
      throw new BadRequestException(
        'One or more accounts do not exist or do not belong to this business',
      );
    }

    // Verify none of the accounts are closed
    const closedAccount = accounts.find((a) => a.isClosed);
    if (closedAccount) {
      throw new BadRequestException(`Cannot use closed account: ${closedAccount.name}`);
    }

    const entryDate = dto.entryDate ? new Date(dto.entryDate) : new Date();

    return this.prisma.journalEntry.create({
      data: {
        businessId,
        description: dto.description ?? null,
        referenceNo: dto.referenceNo ?? null,
        entryDate,
        status: 'draft',
        createdBy: userId,
        lines: {
          create: dto.lines.map((line) => ({
            accountId: line.accountId,
            type: line.type,
            amount: line.amount,
          })),
        },
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                accountNumber: true,
              },
            },
          },
        },
      },
    });
  }

  async getJournalEntry(businessId: number, id: number) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, businessId },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                accountNumber: true,
                isClosed: true,
              },
            },
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Journal Entry #${id} not found`);
    }

    return entry;
  }

  async postToLedger(businessId: number, id: number) {
    const entry = await this.getJournalEntry(businessId, id);

    if (entry.status !== 'draft') {
      throw new BadRequestException(
        `Only draft journal entries can be posted. Current status: ${entry.status}`,
      );
    }

    // Validate double entry logic: Sum of Debits must equal Sum of Credits
    let debitsSum = new Decimal(0);
    let creditsSum = new Decimal(0);

    for (const line of entry.lines) {
      if (line.account.isClosed) {
        throw new BadRequestException(
          `Cannot post because account is closed: ${line.account.name}`,
        );
      }

      if (line.type === 'debit') {
        debitsSum = debitsSum.plus(line.amount);
      } else if (line.type === 'credit') {
        creditsSum = creditsSum.plus(line.amount);
      } else {
        throw new BadRequestException(`Invalid transaction line type: ${line.type}`);
      }
    }

    if (!debitsSum.equals(creditsSum)) {
      throw new BadRequestException(
        `Debits and Credits do not balance. Debits: ${debitsSum.toString()}, Credits: ${creditsSum.toString()}`,
      );
    }

    if (debitsSum.isZero()) {
      throw new BadRequestException('Journal entry lines cannot have zero balance');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the entry by setting status to posted
      const updatedEntry = await tx.journalEntry.update({
        where: { id },
        data: { status: 'posted' },
      });

      // 2. Create AccountTransaction (ledger records)
      for (const line of entry.lines) {
        await tx.accountTransaction.create({
          data: {
            accountId: line.accountId,
            type: line.type,
            subType: 'journal',
            amount: line.amount,
            referenceNo: entry.referenceNo ?? null,
            operationDate: entry.entryDate,
            note: entry.description ?? null,
            linkedTransactionId: entry.id,
            createdBy: entry.createdBy,
          },
        });
      }

      return updatedEntry;
    });
  }

  async reverseEntry(businessId: number, id: number, userId: number) {
    const entry = await this.getJournalEntry(businessId, id);

    if (entry.status !== 'posted') {
      throw new BadRequestException(
        `Only posted journal entries can be reversed. Current status: ${entry.status}`,
      );
    }

    // Verify accounts are not closed
    for (const line of entry.lines) {
      if (line.account.isClosed) {
        throw new BadRequestException(
          `Cannot reverse because account is closed: ${line.account.name}`,
        );
      }
    }

    const refNo = entry.referenceNo
      ? `REV-${entry.referenceNo}`.substring(0, 100)
      : `REV-JE-${entry.id}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark status as reversed
      const updatedEntry = await tx.journalEntry.update({
        where: { id },
        data: { status: 'reversed' },
      });

      // 2. Create opposite AccountTransaction entries
      for (const line of entry.lines) {
        const reversedType = line.type === 'debit' ? 'credit' : 'debit';
        await tx.accountTransaction.create({
          data: {
            accountId: line.accountId,
            type: reversedType,
            subType: 'journal_reversal',
            amount: line.amount,
            referenceNo: refNo,
            operationDate: new Date(),
            note:
              `Reversal of Journal Entry #${entry.id}` +
              (entry.description ? `: ${entry.description}` : ''),
            linkedTransactionId: entry.id,
            createdBy: userId,
          },
        });
      }

      return updatedEntry;
    });
  }
}

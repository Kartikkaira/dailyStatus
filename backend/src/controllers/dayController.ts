import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validateMonthAndDay } from '../utils/dayValidator';

const upsertDaySchema = z.object({
  status_text: z.string().min(1, 'Status text cannot be empty').max(500, 'Status text cannot exceed 500 characters'),
  status_color: z.string().max(50, 'Status color cannot exceed 50 characters').optional().nullable(),
});

export async function getAllDays(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const days = await prisma.dayStatus.findMany({
      orderBy: [
        { month: 'asc' },
        { day: 'asc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      count: days.length,
      days: days.map((item) => ({
        id: item.id,
        month: item.month,
        day: item.day,
        status_text: item.statusText,
        status_color: item.statusColor,
        updated_by: item.user ? { id: item.user.id, email: item.user.email } : null,
        updated_at: item.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function getDayStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = parseInt(req.params.month, 10);
    const day = parseInt(req.params.day, 10);

    const validation = validateMonthAndDay(month, day);
    if (!validation.isValid) {
      res.status(400).json({ error: validation.message });
      return;
    }

    const dayStatus = await prisma.dayStatus.findUnique({
      where: {
        month_day: {
          month,
          day,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!dayStatus) {
      res.status(404).json({
        error: `No status set for month ${month}, day ${day}.`,
        month,
        day,
      });
      return;
    }

    res.status(200).json({
      id: dayStatus.id,
      month: dayStatus.month,
      day: dayStatus.day,
      status_text: dayStatus.statusText,
      status_color: dayStatus.statusColor,
      updated_by: dayStatus.user ? { id: dayStatus.user.id, email: dayStatus.user.email } : null,
      updated_at: dayStatus.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

export async function upsertDayStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = parseInt(req.params.month, 10);
    const day = parseInt(req.params.day, 10);

    const validation = validateMonthAndDay(month, day);
    if (!validation.isValid) {
      res.status(400).json({ error: validation.message });
      return;
    }

    const body = upsertDaySchema.parse(req.body);
    const userId = req.user!.id;

    const dayStatus = await prisma.dayStatus.upsert({
      where: {
        month_day: {
          month,
          day,
        },
      },
      update: {
        statusText: body.status_text,
        statusColor: body.status_color || null,
        updatedBy: userId,
      },
      create: {
        month,
        day,
        statusText: body.status_text,
        statusColor: body.status_color || null,
        updatedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'Day status saved successfully',
      data: {
        id: dayStatus.id,
        month: dayStatus.month,
        day: dayStatus.day,
        status_text: dayStatus.statusText,
        status_color: dayStatus.statusColor,
        updated_by: {
          id: dayStatus.user.id,
          email: dayStatus.user.email,
        },
        updated_at: dayStatus.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

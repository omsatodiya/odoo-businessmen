import { NextRequest } from "next/server";
import { format } from "date-fns";
import { Api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/services/mailer.service";

export async function POST(req: NextRequest) {
  try {
    const today = new Date();
    
    // Helper to calculate exact date bounds for N days from now
    const getTargetBounds = (daysFromNow: number) => {
      const target = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysFromNow);
      const start = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0, 0);
      const end = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59, 999);
      return { start, end };
    };

    // Calculate bounds for 3 and 7 days
    const bounds3 = getTargetBounds(3);
    const bounds7 = getTargetBounds(7);

    // Query drivers expiring in exactly 3 or 7 days
    const [expiring3, expiring7] = await Promise.all([
      prisma.driver.findMany({
        where: {
          licenseExpiry: {
            gte: bounds3.start,
            lte: bounds3.end,
          },
        },
      }),
      prisma.driver.findMany({
        where: {
          licenseExpiry: {
            gte: bounds7.start,
            lte: bounds7.end,
          },
        },
      }),
    ]);

    const sentReminders: { driverId: string; email: string; daysRemaining: number }[] = [];

    // Send 7-day warnings
    for (const driver of expiring7) {
      const targetEmail = driver.email || `${driver.name.toLowerCase().replace(/\s+/g, "")}@transitops.in`;
      const expiryFormatted = format(new Date(driver.licenseExpiry), "d MMM yyyy");
      
      const emailHtml = `
        <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 12px;">License Expiration Notice (7 Days)</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-top: 0; margin-bottom: 24px;">
          Hello <strong>${driver.name}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-top: 0; margin-bottom: 16px;">
          This is an automated reminder that your commercial driver's license (No: <strong>${driver.licenseNo}</strong>, Category: <strong>${driver.licenseCategory}</strong>) is scheduled to expire in exactly <strong>7 days</strong> on <strong>${expiryFormatted}</strong>.
        </p>
        <div style="background-color: #27272a; padding: 16px; border-left: 4px solid #f59e0b; margin-bottom: 24px;">
          <p style="font-size: 13px; line-height: 1.5; color: #ededef; margin: 0;">
            <strong>Action Required:</strong> Please submit your renewal application to avoid vehicle dispatch interruptions and compliance flags.
          </p>
        </div>
      `;

      await sendEmail({
        to: targetEmail,
        subject: `Action Required: Your driver license expires in 7 days - ${driver.name}`,
        html: emailHtml,
      });

      sentReminders.push({ driverId: driver.id, email: targetEmail, daysRemaining: 7 });
    }

    // Send 3-day warnings (Urgent)
    for (const driver of expiring3) {
      const targetEmail = driver.email || `${driver.name.toLowerCase().replace(/\s+/g, "")}@transitops.in`;
      const expiryFormatted = format(new Date(driver.licenseExpiry), "d MMM yyyy");
      
      const emailHtml = `
        <h2 style="font-size: 20px; font-weight: 600; color: #f43f5e; margin-top: 0; margin-bottom: 12px;">URGENT: License Expiration Notice (3 Days)</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-top: 0; margin-bottom: 24px;">
          Hello <strong>${driver.name}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-top: 0; margin-bottom: 16px;">
          This is an <strong>urgent warning</strong> that your commercial driver's license (No: <strong>${driver.licenseNo}</strong>, Category: <strong>${driver.licenseCategory}</strong>) is scheduled to expire in exactly <strong>3 days</strong> on <strong>${expiryFormatted}</strong>.
        </p>
        <div style="background-color: #27272a; padding: 16px; border-left: 4px solid #f43f5e; margin-bottom: 24px;">
          <p style="font-size: 13px; line-height: 1.5; color: #ededef; margin: 0;">
            <strong>Immediate Action Required:</strong> To prevent automatic dashboard lockout and suspension from active transit trip dispatches, renew your credentials immediately.
          </p>
        </div>
      `;

      await sendEmail({
        to: targetEmail,
        subject: `URGENT: Your driver license expires in 3 days - ${driver.name}`,
        html: emailHtml,
      });

      sentReminders.push({ driverId: driver.id, email: targetEmail, daysRemaining: 3 });
    }

    logger.info(`Cron Expiry Scan Completed: Sent ${sentReminders.length} reminders.`);

    return Api.ok({
      success: true,
      remindersSent: sentReminders,
      scannedAt: today.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to run license expiry reminders cron", error);
    return Api.internalError();
  }
}

import nodemailer from 'nodemailer'
import { prisma } from './db'

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'

export type NotificationType =
  | 'RESERVATION_CREATED'
  | 'RESERVATION_CONFIRMED'
  | 'PRODUCT_ARRIVED'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailData {
  customerName: string
  reservationId: string
  reservationCode: string
  productName: string
  variant: string
  quantity: number
  trackingLink: string
  email: string
  language?: string
}

type StatusMessageType = 
  | 'RESERVATION_CREATED'
  | 'RESERVATION_CONFIRMED'
  | 'PRODUCT_ARRIVED'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'

const emailTemplates: Record<StatusMessageType, (data: EmailData) => { subject: string; html: string }> = {
  RESERVATION_CREATED: (data) => ({
    subject: data.language === 'ar'
      ? `تأكيد الحجز #${data.reservationCode}`
      : `Reservation Confirmed #${data.reservationCode}`,
    html: data.language === 'ar' ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #0066CC; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">تم تقديم طلب الحجز ✅</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #374151;">مرحباً <strong>${data.customerName}</strong> 👋</p>
          <p style="color: #374151;">تم استلام طلب حجزك بنجاح وهو قيد المراجعة.</p>
          <div style="background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #1e40af;"><strong>رقم الحجز:</strong> #${data.reservationCode}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>المنتج:</strong> ${data.productName}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>المواصفات:</strong> ${data.variant}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>الكمية:</strong> ${data.quantity}</p>
          </div>
          <p style="color: #374151;">يمكنك متابعة حالة حجزك من خلال:</p>
          <a href="${data.trackingLink}" style="display: inline-block; background: #0066CC; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">تتبع حجزك</a>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">أو انسخ الرابط: ${data.trackingLink}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px; text-align: center;">شكراً لاختياركم لنا</p>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #0066CC; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Reservation Submitted ✅</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #374151;">Hello <strong>${data.customerName}</strong> 👋</p>
          <p style="color: #374151;">Your reservation has been received and is under review.</p>
          <div style="background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #1e40af;"><strong>Reservation:</strong> #${data.reservationCode}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>Product:</strong> ${data.productName}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>Variant:</strong> ${data.variant}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>Quantity:</strong> ${data.quantity}</p>
          </div>
          <p style="color: #374151;">Track your reservation:</p>
          <a href="${data.trackingLink}" style="display: inline-block; background: #0066CC; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Track Reservation</a>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Or copy the link: ${data.trackingLink}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px; text-align: center;">Thank you for choosing us</p>
        </div>
      </div>
    `,
  }),

  RESERVATION_CONFIRMED: (data) => ({
    subject: data.language === 'ar'
      ? `تم تأكيد حجزك #${data.reservationCode}`
      : `Your Reservation is Confirmed #${data.reservationCode}`,
    html: data.language === 'ar' ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #0066CC; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">تم تأكيد الحجز 🎉</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">مرحباً <strong>${data.customerName}</strong> 👋</p>
          <p style="color: #374151;">تم تأكيد حجزك بنجاح.</p>
          <div style="background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #1e40af;"><strong>رقم الحجز:</strong> #${data.reservationCode}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>المنتج:</strong> ${data.productName}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>المواصفات:</strong> ${data.variant}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>الكمية:</strong> ${data.quantity}</p>
          </div>
          <a href="${data.trackingLink}" style="display: inline-block; background: #0066CC; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">تتبع حجزك</a>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px; text-align: center;">شكراً لاختياركم لنا</p>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #0066CC; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Reservation Confirmed 🎉</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">Hello <strong>${data.customerName}</strong> 👋</p>
          <p style="color: #374151;">Your reservation has been confirmed successfully.</p>
          <div style="background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #1e40af;"><strong>Reservation:</strong> #${data.reservationCode}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>Product:</strong> ${data.productName}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>Variant:</strong> ${data.variant}</p>
            <p style="margin: 5px 0; color: #1e40af;"><strong>Quantity:</strong> ${data.quantity}</p>
          </div>
          <a href="${data.trackingLink}" style="display: inline-block; background: #0066CC; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Track Reservation</a>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px; text-align: center;">Thank you for choosing us</p>
        </div>
      </div>
    `,
  }),

  PRODUCT_ARRIVED: (data) => ({
    subject: data.language === 'ar'
      ? `وصل منتجك! #${data.reservationCode}`
      : `Your Product Has Arrived! #${data.reservationCode}`,
    html: data.language === 'ar' ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #7c3aed; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">وصل المنتج! 📦</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">مرحباً <strong>${data.customerName}</strong> 👋</p>
          <p style="color: #374151;">وصل المنتج الخاص بحجزك! 🎉</p>
          <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #6d28d9;"><strong>رقم الحجز:</strong> #${data.reservationCode}</p>
            <p style="margin: 5px 0; color: #6d28d9;"><strong>المنتج:</strong> ${data.productName}</p>
            <p style="margin: 5px 0; color: #6d28d9;"><strong>المواصفات:</strong> ${data.variant}</p>
          </div>
          <p style="color: #374151;">تابع حالة طلبك لمعرفة موعد الاستلام:</p>
          <a href="${data.trackingLink}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">تتبع حجزك</a>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #7c3aed; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Your Product Has Arrived! 📦</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">Hello <strong>${data.customerName}</strong> 👋</p>
          <p style="color: #374151;">Your reserved product has arrived! 🎉</p>
          <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #6d28d9;"><strong>Reservation:</strong> #${data.reservationCode}</p>
            <p style="margin: 5px 0; color: #6d28d9;"><strong>Product:</strong> ${data.productName}</p>
            <p style="margin: 5px 0; color: #6d28d9;"><strong>Variant:</strong> ${data.variant}</p>
          </div>
          <a href="${data.trackingLink}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Track Reservation</a>
        </div>
      </div>
    `,
  }),

  READY_FOR_PICKUP: (data) => ({
    subject: data.language === 'ar'
      ? `طلبك جاهز للاستلام! #${data.reservationCode}`
      : `Ready for Pickup! #${data.reservationCode}`,
    html: data.language === 'ar' ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #059669; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">جاهز للاستلام ✅</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">مرحباً <strong>${data.customerName}</strong> 👋</p>
          <p style="color: #374151;">طلبك جاهز للاستلام!</p>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #065f46;"><strong>رقم الحجز:</strong> #${data.reservationCode}</p>
            <p style="margin: 5px 0; color: #065f46;"><strong>المنتج:</strong> ${data.productName}</p>
            <p style="margin: 5px 0; color: #065f46;"><strong>المواصفات:</strong> ${data.variant}</p>
          </div>
          <p style="color: #374151; font-weight: bold;">⚠️ يرجى إبراز رقم الحجز أو QR Code عند الاستلام</p>
          <a href="${data.trackingLink}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">عرض QR Code</a>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #059669; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Ready for Pickup ✅</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">Hello <strong>${data.customerName}</strong> 👋</p>
          <p style="color: #374151;">Your order is ready for pickup!</p>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #065f46;"><strong>Reservation:</strong> #${data.reservationCode}</p>
            <p style="margin: 5px 0; color: #065f46;"><strong>Product:</strong> ${data.productName}</p>
            <p style="margin: 5px 0; color: #065f46;"><strong>Variant:</strong> ${data.variant}</p>
          </div>
          <p style="color: #374151; font-weight: bold;">⚠️ Please show your reservation number or QR Code when collecting</p>
          <a href="${data.trackingLink}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View QR Code</a>
        </div>
      </div>
    `,
  }),

  COMPLETED: (data) => ({
    subject: data.language === 'ar'
      ? `تم اكتمال طلبك #${data.reservationCode}`
      : `Order Completed #${data.reservationCode}`,
    html: data.language === 'ar' ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #0066CC; color: white; padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">اكتمل الطلب 🎊</h1>
          <p style="margin: 10px 0 0;">شكراً لثقتكم بنا</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 10px; text-align: center;">
          <p style="color: #374151;">مرحباً <strong>${data.customerName}</strong>، نتمنى أن تستمتع بـ ${data.productName} الجديد! 🍎</p>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #0066CC; color: white; padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Order Completed 🎊</h1>
          <p style="margin: 10px 0 0;">Thank you for your trust</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 10px; text-align: center;">
          <p style="color: #374151;">Hello <strong>${data.customerName}</strong>, enjoy your new ${data.productName}! 🍎</p>
        </div>
      </div>
    `,
  }),

  CANCELLED: (data) => ({
    subject: data.language === 'ar'
      ? `تم إلغاء الحجز #${data.reservationCode}`
      : `Reservation Cancelled #${data.reservationCode}`,
    html: data.language === 'ar' ? `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #dc2626; color: white; padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">تم إلغاء الحجز</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 10px;">
          <p style="color: #374151;">مرحباً <strong>${data.customerName}</strong>، تم إلغاء حجزك رقم #${data.reservationCode}.</p>
          <p style="color: #374151;">إذا كان هذا خطأ، يرجى التواصل معنا.</p>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: #dc2626; color: white; padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Reservation Cancelled</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 10px;">
          <p style="color: #374151;">Hello <strong>${data.customerName}</strong>, your reservation #${data.reservationCode} has been cancelled.</p>
          <p style="color: #374151;">If this was a mistake, please contact us.</p>
        </div>
      </div>
    `,
  }),
}

export async function sendStatusEmail(
  reservationId: string,
  type: StatusMessageType,
  data: EmailData
): Promise<void> {
  const template = emailTemplates[type](data)

  // Log to DB first
  const notification = await prisma.notification.create({
    data: {
      reservationId,
      type: type as NotificationType,
      status: 'PENDING',
      recipient: data.email,
      subject: template.subject,
      body: template.html,
    },
  })

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Pre-Order System'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.email,
      subject: template.subject,
      html: template.html,
    })

    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'SENT', sentAt: new Date() },
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'FAILED', error: errMsg },
    })
    console.error('Email send failed:', errMsg)
  }
}

export async function retryNotification(notificationId: string): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })
  if (!notification || notification.status !== 'FAILED') return

  try {
    await transporter.sendMail({
      from: `"Pre-Order System" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: notification.recipient,
      subject: notification.subject,
      html: notification.body,
    })

    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'SENT', sentAt: new Date(), error: null },
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    await prisma.notification.update({
      where: { id: notificationId },
      data: { error: errMsg },
    })
  }
}

// Map reservation status to notification type
export function getNotificationTypeForStatus(
  status: ReservationStatus
): StatusMessageType | null {
  const map: Partial<Record<ReservationStatus, StatusMessageType>> = {
    CONFIRMED: 'RESERVATION_CONFIRMED',
    ARRIVED: 'PRODUCT_ARRIVED',
    READY_FOR_PICKUP: 'READY_FOR_PICKUP',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  }
  return map[status] || null
}

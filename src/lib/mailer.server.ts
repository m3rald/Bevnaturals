import nodemailer from 'nodemailer';
import { formatNgn } from './catalog.ts';
import { storeConfig } from './store-config.ts';
import type { Order } from './types.ts';

function getOwnerEmail(): string {
  return process.env.STORE_OWNER_EMAIL?.trim() || storeConfig.email;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildOrderEmailContent(order: Order): {
  subject: string;
  text: string;
  html: string;
} {
  const payable =
    order.totalNgn ??
    order.subtotalNgn - (order.discountNgn ?? 0) + (order.deliveryFeeNgn ?? 0);

  const itemsText =
    order.items.length > 0
      ? order.items
          .map(
            (item) =>
              `- ${item.productName} (${item.sizeLabel}) x ${item.quantity}: ${formatNgn(
                item.lineTotalNgn
              )}`
          )
          .join('\n')
      : '- Paystack Order Purchase (see Paystack reference for full cart line summary)';

  const itemsHtml =
    order.items.length > 0
      ? order.items
          .map(
            (item) => `
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e7ddd0;">
                  <strong>${escapeHtml(item.productName)}</strong><br/>
                  <span style="color:#5C4E45;font-size:12px;">${escapeHtml(
                    item.sizeLabel
                  )} &times; ${item.quantity} (${formatNgn(item.unitPriceNgn)} each)</span>
                </td>
                <td style="padding:8px 0;border-bottom:1px solid #e7ddd0;text-align:right;font-family:monospace;">
                  ${formatNgn(item.lineTotalNgn)}
                </td>
              </tr>`
          )
          .join('')
      : `<tr><td colspan="2" style="padding:8px 0;color:#5C4E45;">Paystack verified order purchase</td></tr>`;

  const isOpay = order.paymentMethod === 'opay';
  const subject = `Bev Naturals Order ${isOpay ? 'Placed' : 'Confirmation'} · ${order.orderNumber}`;

  const text = [
    `BEV NATURALS COSMETICS — ORDER ${isOpay ? 'RECEIPT (OPAY TRANSFER)' : 'CONFIRMATION'}`,
    ``,
    `Order Number: ${order.orderNumber}`,
    order.verificationCode ? `4-Letter Verification Code: ${order.verificationCode}` : '',
    `Order Date: ${new Date(order.createdAt).toLocaleString('en-NG')}`,
    `Payment Status: ${order.status.toUpperCase()} (${order.paymentChannel})`,
    `Payment Reference: ${order.paymentReference}`,
    isOpay
      ? `WhatsApp Screenshot Verification: Send screenshot + code ${order.verificationCode || ''} to ${storeConfig.opay.whatsappNumber}`
      : '',
    ``,
    `CUSTOMER DETAILS`,
    `Full Name: ${order.customer.fullName}`,
    `Email: ${order.customer.email}`,
    `Phone: ${order.customer.phone}`,
    ``,
    `DELIVERY / SHIPPING DETAILS`,
    `Region: ${order.shipping.regionLabel || 'Nigeria'}`,
    `Method: ${order.shipping.methodLabel || 'Standard Dispatch'}`,
    `Address / Park: ${order.shipping.address}`,
    `City / State: ${order.shipping.city}, ${order.shipping.state}`,
    order.shipping.note ? `Customer Note: ${order.shipping.note}` : '',
    ``,
    `ITEMS ORDERED`,
    itemsText,
    ``,
    `Products Subtotal: ${formatNgn(order.subtotalNgn)}`,
    (order.discountNgn ?? 0) > 0
      ? `${order.discountLabel || '10% Promo Discount'}: -${formatNgn(order.discountNgn ?? 0)}`
      : '',
    `Shipping Fee: ${formatNgn(order.deliveryFeeNgn ?? 0)}`,
    `${isOpay ? 'Total Transferred (OPay)' : 'Total Paid on Paystack'}: ${formatNgn(payable)}`,
    ``,
    `Store Contact: ${storeConfig.email} · Ibadan, Oyo State, Nigeria`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;background:#F3EBDF;color:#1C1410;padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:#FAF5EE;border:1px solid #DFD4C4;border-radius:12px;padding:28px;">
        <p style="margin:0 0 4px;font-size:12px;color:#5C4E45;text-transform:uppercase;letter-spacing:0.08em;">
          Bev Naturals Cosmetics · Ibadan, Nigeria
        </p>
        <h1 style="margin:0 0 8px;font-size:24px;color:#1C1410;">
          Order ${isOpay ? 'Placed' : 'Confirmed'}: ${escapeHtml(order.orderNumber)}
        </h1>
        <p style="margin:0 0 12px;font-size:14px;color:#5C4E45;">
          Channel: <strong>${escapeHtml(order.paymentChannel)}</strong> · Ref:
          <span style="font-family:monospace;">${escapeHtml(order.paymentReference)}</span>
        </p>
        ${
          order.verificationCode
            ? `<div style="margin:0 0 18px;padding:12px 14px;background:#F3EBDF;border:1px solid #B85C38;border-radius:8px;font-size:13px;">
                <strong>4-LETTER VERIFICATION CODE: <span style="font-family:monospace;font-size:16px;letter-spacing:0.18em;">${escapeHtml(
                  order.verificationCode
                )}</span></strong><br/>
                Send screenshot of this order + code to WhatsApp <strong>${escapeHtml(
                  storeConfig.opay.whatsappNumber
                )}</strong>.
              </div>`
            : ''
        }

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
          <tr>
            <td style="vertical-align:top;padding:12px;background:#F3EBDF;border-radius:8px;width:48%;">
              <strong style="display:block;margin-bottom:6px;">Customer Details</strong>
              <div>${escapeHtml(order.customer.fullName)}</div>
              <div>${escapeHtml(order.customer.email)}</div>
              <div>${escapeHtml(order.customer.phone)}</div>
            </td>
            <td style="width:4%;"></td>
            <td style="vertical-align:top;padding:12px;background:#F3EBDF;border-radius:8px;width:48%;">
              <strong style="display:block;margin-bottom:6px;">Delivery Details</strong>
              <div>${escapeHtml(order.shipping.methodLabel || 'Dispatch')} (${escapeHtml(
                order.shipping.regionLabel || order.shipping.state
              )})</div>
              <div>${escapeHtml(order.shipping.address)}</div>
              <div>${escapeHtml(order.shipping.city)}, ${escapeHtml(order.shipping.state)}</div>
              ${
                order.shipping.note
                  ? `<div style="margin-top:4px;color:#5C4E45;">Note: ${escapeHtml(
                      order.shipping.note
                    )}</div>`
                  : ''
              }
            </td>
          </tr>
        </table>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
          <thead>
            <tr>
              <th style="text-align:left;padding-bottom:8px;border-bottom:1px solid #DFD4C4;font-size:12px;color:#5C4E45;">Item</th>
              <th style="text-align:right;padding-bottom:8px;border-bottom:1px solid #DFD4C4;font-size:12px;color:#5C4E45;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="border-top:1px solid #DFD4C4;padding-top:12px;font-size:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span>Products Subtotal</span>
            <strong>${formatNgn(order.subtotalNgn)}</strong>
          </div>
          ${
            (order.discountNgn ?? 0) > 0
              ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#3D5344;">
                  <span>${escapeHtml(order.discountLabel || '10% Launch Week Off')}</span>
                  <strong>-${formatNgn(order.discountNgn ?? 0)}</strong>
                </div>`
              : ''
          }
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span>Shipping Fee</span>
            <strong>${formatNgn(order.deliveryFeeNgn ?? 0)}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #DFD4C4;font-size:16px;">
            <strong>${isOpay ? 'Total Transferred (OPay)' : 'Total Paid on Paystack'}</strong>
            <strong>${formatNgn(payable)}</strong>
          </div>
        </div>
      </div>
    </div>
  `;

  return { subject, text, html };
}

export async function sendOrderReceiptEmails(
  order: Order
): Promise<NonNullable<Order['emailFeedback']>> {
  const ownerEmail = getOwnerEmail();
  const customerEmail = order.customer.email?.trim();
  const recipients = Array.from(
    new Set([customerEmail, ownerEmail].filter((e): e is string => Boolean(e && e.includes('@'))))
  );

  const { subject, text, html } = buildOrderEmailContent(order);

  // 1. Resend HTTP API if configured
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey && recipients.length > 0) {
    try {
      const fromAddress =
        process.env.EMAIL_FROM?.trim() || `Bev Naturals <onboarding@resend.dev>`;

      const sendTo = async (to: string, prefixSubject?: string) => {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [to],
            reply_to: ownerEmail,
            subject: prefixSubject ? `${prefixSubject} ${subject}` : subject,
            text,
            html,
          }),
        });
        return res.ok;
      };

      const [custOk, ownerOk] = await Promise.all([
        customerEmail ? sendTo(customerEmail) : Promise.resolve(false),
        ownerEmail && ownerEmail.toLowerCase() !== customerEmail?.toLowerCase()
          ? sendTo(ownerEmail, '[New Paid Order]')
          : Promise.resolve(true),
      ]);

      return {
        sentAt: new Date().toISOString(),
        customerNotified: Boolean(custOk),
        ownerNotified: Boolean(ownerOk),
        channel: 'resend',
      };
    } catch (err) {
      console.error('Resend receipt dispatch failed:', err);
    }
  }

  // 2. Standard SMTP (e.g. Gmail smtp.gmail.com + App Password) via nodemailer
  const smtpHost = process.env.SMTP_HOST?.trim() || (process.env.SMTP_USER ? 'smtp.gmail.com' : '');
  const smtpUser = process.env.SMTP_USER?.trim() || '';
  const smtpPass = process.env.SMTP_PASS?.trim() || '';
  const smtpPort = Number(process.env.SMTP_PORT || 465);

  if (smtpHost && smtpUser && smtpPass && recipients.length > 0) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const fromAddress =
        process.env.EMAIL_FROM?.trim() || `"${storeConfig.brandName}" <${smtpUser}>`;

      if (customerEmail) {
        await transporter.sendMail({
          from: fromAddress,
          to: customerEmail,
          bcc:
            ownerEmail && ownerEmail.toLowerCase() !== customerEmail.toLowerCase()
              ? ownerEmail
              : undefined,
          replyTo: ownerEmail,
          subject,
          text,
          html,
        });
      } else if (ownerEmail) {
        await transporter.sendMail({
          from: fromAddress,
          to: ownerEmail,
          subject: `[New Paid Order] ${subject}`,
          text,
          html,
        });
      }

      return {
        sentAt: new Date().toISOString(),
        customerNotified: Boolean(customerEmail),
        ownerNotified: Boolean(ownerEmail),
        channel: 'smtp',
      };
    } catch (err) {
      console.error('SMTP receipt dispatch failed:', err);
    }
  }

  // 3. Fallback status when SMTP/Resend keys are not configured (Paystack metadata still carries full fields)
  return {
    customerNotified: false,
    ownerNotified: false,
    channel: order.paymentMethod === 'opay' ? 'manual_transfer' : 'paystack_receipt',
  };
}

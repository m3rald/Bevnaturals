import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { storeConfig } from '../lib/store-config';

const FAQS = [
  {
    q: 'Do I need an account to place an order?',
    a: 'No. Customer accounts are disabled so you can check out directly as a guest with your name, email, phone number, Nigerian region/state, and delivery option.',
  },
  {
    q: 'Which payment methods are supported?',
    a: 'All orders are processed securely through Paystack using Visa, Mastercard, Verve, Bank Transfer, or USSD with instant confirmation.',
  },
  {
    q: 'How are shipping fees calculated across Nigeria?',
    a: 'At checkout, select your region and state from all 36 Nigerian states plus FCT Abuja. Ibadan Pick Up is ₦0 and Ibadan Delivery is ₦3,500; Western Nigeria is ₦3,500 logistics pick up / ₦5,000 doorstep; Abuja, Kwara & Kogi are ₦5,000 logistics pick up / ₦6,000 doorstep; Eastern and Southern Nigeria are ₦4,500 logistics pick up / ₦5,000 doorstep; Northern Nigeria doorstep is ₦9,000.',
  },
  {
    q: 'Does the 10% timed promotion apply to shipping fees?',
    a: 'No. When the 10% appreciation window is active, the 10% discount is deducted strictly from your product subtotal. Shipping fees are independent and paid in full alongside your Paystack checkout total.',
  },
  {
    q: 'Are Kiddies session products safe for children?',
    a: 'Yes. Our Kiddies Nature Pop Conditioning Sample, Nature Bloom Leave-In Conditioner, Nature Melt Rinse-Out Conditioner, Nature Shield Anti Bald Hair Butter, and Kiddies Hair Growth Oil are formulated gently for children.',
  },
  {
    q: 'How do I follow up on an order?',
    a: `Keep your order number (for example BN-1041-...) and email ${storeConfig.email} with your payment reference if you need an update.`,
  },
];

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-2 pb-6 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
        <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
          Guidance & Store Policies
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
          Frequently Asked Questions
        </h1>
      </div>

      <div className="divide-y divide-[#1C1410]/10 dark:divide-[#F3EBDF]/10 rounded-xl border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#FAF5EE] dark:bg-[#1E1814]">
        {FAQS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={item.q}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer hover:bg-[#1C1410]/[0.02] dark:hover:bg-[#F3EBDF]/[0.02]"
              >
                <span className="font-display text-xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                  {item.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-[#5C4E45] dark:text-[#B8AA9B] transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 text-sm leading-relaxed text-[#5C4E45] dark:text-[#B8AA9B]">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

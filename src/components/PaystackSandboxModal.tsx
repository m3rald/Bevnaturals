import { useState } from 'react';
import { CreditCard, Landmark, ShieldCheck, Smartphone, X } from 'lucide-react';
import { formatNgn } from '../lib/catalog';

interface PaystackSandboxModalProps {
  open: boolean;
  customerEmail: string;
  orderNumber: string;
  reference: string;
  amountNgn: number;
  onSuccess: (channelLabel: string) => Promise<void>;
  onCancel: () => void;
}

type ChannelOption = 'card' | 'transfer' | 'ussd';

export function PaystackSandboxModal({
  open,
  customerEmail,
  orderNumber,
  reference,
  amountNgn,
  onSuccess,
  onCancel,
}: PaystackSandboxModalProps) {
  const [channel, setChannel] = useState<ChannelOption>('card');
  const [processing, setProcessing] = useState(false);

  if (!open) return null;

  const handleAuthorize = async () => {
    setProcessing(true);
    const label =
      channel === 'card'
        ? 'Paystack Test (Visa •••• 4081)'
        : channel === 'transfer'
          ? 'Paystack Test (Bank Transfer)'
          : 'Paystack Test (USSD)';
    try {
      await onSuccess(label);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1410]/65 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Paystack Test Checkout"
    >
      <div className="w-full max-w-md rounded-xl border border-[#1C1410]/15 dark:border-[#F3EBDF]/15 bg-[#FAF5EE] dark:bg-[#1E1814] text-[#1C1410] dark:text-[#F3EBDF] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#1C1410] text-[#F3EBDF]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#C6A36A]" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-wide">Paystack Checkout · Test Mode</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            aria-label="Cancel Paystack checkout"
            className="p-1 text-[#F3EBDF]/75 hover:text-[#F3EBDF] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-baseline justify-between pb-4 border-b border-[#1C1410]/10 dark:border-[#F3EBDF]/10">
            <div>
              <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B]">Bev Naturals Cosmetics</p>
              <p className="text-xs text-[#5C4E45] dark:text-[#B8AA9B] mt-0.5">{customerEmail}</p>
            </div>
            <div className="text-right">
              <p className="font-mono-num text-xl font-semibold text-[#1C1410] dark:text-[#F3EBDF]">
                {formatNgn(amountNgn)}
              </p>
              <p className="font-mono-num text-[11px] text-[#5C4E45] dark:text-[#B8AA9B]">
                {orderNumber}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B]">
              Choose a Paystack payment channel
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('card')}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  channel === 'card'
                    ? 'border-[#B85C38] bg-[#B85C38]/10 text-[#1C1410] dark:text-[#F3EBDF]'
                    : 'border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-[#5C4E45] dark:text-[#B8AA9B]'
                }`}
              >
                <CreditCard className="w-4 h-4" aria-hidden="true" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('transfer')}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  channel === 'transfer'
                    ? 'border-[#B85C38] bg-[#B85C38]/10 text-[#1C1410] dark:text-[#F3EBDF]'
                    : 'border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-[#5C4E45] dark:text-[#B8AA9B]'
                }`}
              >
                <Landmark className="w-4 h-4" aria-hidden="true" />
                <span>Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('ussd')}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  channel === 'ussd'
                    ? 'border-[#B85C38] bg-[#B85C38]/10 text-[#1C1410] dark:text-[#F3EBDF]'
                    : 'border-[#1C1410]/15 dark:border-[#F3EBDF]/15 text-[#5C4E45] dark:text-[#B8AA9B]'
                }`}
              >
                <Smartphone className="w-4 h-4" aria-hidden="true" />
                <span>USSD</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[#1C1410]/10 dark:border-[#F3EBDF]/10 bg-[#F3EBDF] dark:bg-[#14100D] p-3.5 text-xs space-y-1 text-[#5C4E45] dark:text-[#B8AA9B]">
            <p className="font-medium text-[#1C1410] dark:text-[#F3EBDF]">
              {channel === 'card'
                ? 'Test Card: 4084 0840 8408 4081 · 12/28 · CVV 408'
                : channel === 'transfer'
                  ? 'Simulated Paystack Virtual Account · Instant Verification'
                  : 'Simulated USSD *737*000*... · Instant Verification'}
            </p>
            <p>
              Reference: <span className="font-mono-num">{reference}</span>
            </p>
            <p className="pt-1">
              Add <span className="font-mono-num">PAYSTACK_SECRET_KEY</span> in Secrets when ready to switch to live Paystack transactions.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              disabled={processing}
              onClick={handleAuthorize}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#3D5344] text-[#FAF5EE] hover:bg-[#2F4135] disabled:opacity-60 text-sm font-semibold transition-colors cursor-pointer"
            >
              {processing ? 'Verifying Paystack Payment…' : `Pay ${formatNgn(amountNgn)}`}
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={onCancel}
              className="w-full min-h-[40px] px-4 py-2 rounded-lg text-xs font-medium text-[#5C4E45] dark:text-[#B8AA9B] hover:text-[#1C1410] dark:hover:text-[#F3EBDF] cursor-pointer"
            >
              Cancel & Switch Payment Option
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

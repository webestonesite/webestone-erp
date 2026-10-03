import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import { Copy, CheckCircle } from 'lucide-react';

interface BankTransferFormProps {
  planId: number;
  planPrice: number;
  couponCode: string;
  billingCycle: string;
  bankDetails: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BankTransferForm({ 
  planId, 
  planPrice,
  couponCode, 
  billingCycle, 
  bankDetails,
  onSuccess, 
  onCancel 
}: BankTransferFormProps) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);

  const { storageSettings } = usePage().props as any;
    
  const allowedTypes = storageSettings?.allowed_file_types || 'jpg,png,webp,gif';
  const acceptAttribute = allowedTypes
      .split(',')
      .map((type) => `.${type.trim()}`)
      .join(',');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('Copied to clipboard'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceipt(e.target.files?.[0] ?? null);
  };

  const handleConfirmPayment = () => {
    setProcessing(true);
    
    const formData = new FormData();
    formData.append('plan_id', String(planId));
    formData.append('billing_cycle', billingCycle);
    formData.append('coupon_code', couponCode);
    formData.append('amount', String(planPrice));
    if (receipt) formData.append('receipt', receipt);

    router.post(route('bank.payment'), formData, {
      forceFormData: true,
      onSuccess: () => {
        toast.success(t('Payment request submitted successfully'));
        onSuccess();
      },
      onError: () => {
        toast.error(t('Failed to submit payment request'));
        setProcessing(false);
      },
      onFinish: () => { setProcessing(false); }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">{t('Bank Transfer Details')}</h3>
          <div className="space-y-3 text-sm">
            <div className="whitespace-pre-line">{bankDetails}</div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="font-medium">{t('Amount')}: ${planPrice}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(planPrice.toString())}
              >
                <Copy className="h-3 w-3 mr-1" />
                {t('Copy')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Upload */}
      <div>
        <Label htmlFor="bank-plan-receipt">{t('Payment Receipt')} <span className="text-muted-foreground text-xs">({t('optional')})</span></Label>
        <Input id="bank-plan-receipt" type="file" accept={acceptAttribute} className="mt-1" onChange={handleFileChange} />
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">{t('Important Instructions')}</p>
              <ul className="space-y-1 text-xs">
                <li>• {t('Transfer the exact amount shown above')}</li>
                <li>• {t('Include your order reference in the transfer description')}</li>
                <li>• {t('Your plan will be activated after payment verification')}</li>
                <li>• {t('Verification may take 1-3 business days')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          {t('Cancel')}
        </Button>
        <Button 
          onClick={handleConfirmPayment} 
          disabled={processing}
          className="flex-1"
        >
          {processing ? t('Processing...') : t('I have made the payment')}
        </Button>
      </div>
    </div>
  );
}
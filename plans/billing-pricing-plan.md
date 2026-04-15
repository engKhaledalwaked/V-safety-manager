# خطة تعديل الأسعار في صفحة الدفع

## الهدف
تعديل صفحة Billing لعرض أسعار مختلفة بناءً على نوع الخدمة المختارة في صفحة الحجز.

## الأسعار المطلوبة

### الفحص الدوري (periodic)
| البند | السعر |
|-------|-------|
| رسوم الطلب | 10 ر.س |
| رسوم الحجز | 105 ر.س |
| **المجموع** | **115 ر.س** |

### إعادة الفحص (reinspection)
| البند | السعر |
|-------|-------|
| سعر إعادة الفحص | 33 ر.س |
| ضريبة القيمة المضافة 15% | 4.95 ر.س |
| **المجموع** | **37.95 ر.س** |

## خطوات التنفيذ

### 1. تعديل Booking.tsx - تمرير serviceType
```tsx
// في دالة handleSubmit
navigate('/billing', { 
  state: { serviceType: formData.serviceType } 
});
```

### 2. تعديل Billing.tsx - استقبال serviceType
```tsx
import { useLocation } from 'react-router-dom';

// في المكون
const location = useLocation();
const serviceType = location.state?.serviceType || 'periodic';
```

### 3. تعديل Billing.tsx - حساب الأسعار ديناميكياً
```tsx
// حساب الأسعار بناءً على نوع الخدمة
const prices = {
  periodic: {
    requestFees: 10,
    bookingFees: 105,
    total: 115,
    vat: 0 // غير مدرج للفحص الدوري
  },
  reinspection: {
    inspectionFees: 33,
    vat: 4.95,
    total: 37.95,
    requestFees: 0,
    bookingFees: 0
  }
};

const currentPrices = prices[serviceType] || prices.periodic;
```

### 4. تعديل Billing.tsx - عرض الأسعار
```tsx
{/* ملخص الدفع */}
<div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-dashed border-gray-300 mt-8 mb-8">
  <h3 className="text-lg font-bold text-gray-800 mb-4">{t('paymentSummary')}</h3>
  <div className="space-y-3 text-sm">
    {serviceType === 'periodic' ? (
      <>
        <div className="flex justify-between">
          <span className="text-gray-600">{t('requestFees')}</span>
          <span className="font-semibold">10 {language === 'ar' ? 'ر.س' : 'SAR'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{t('bookingFees')}</span>
          <span className="font-semibold">105 {language === 'ar' ? 'ر.س' : 'SAR'}</span>
        </div>
      </>
    ) : (
      <>
        <div className="flex justify-between">
          <span className="text-gray-600">{isRTL ? 'سعر إعادة الفحص' : 'Re-inspection Fees'}</span>
          <span className="font-semibold">33 {language === 'ar' ? 'ر.س' : 'SAR'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{isRTL ? 'ضريبة القيمة المضافة 15%' : 'VAT 15%'}</span>
          <span className="font-semibold">4.95 {language === 'ar' ? 'ر.س' : 'SAR'}</span>
        </div>
      </>
    )}
    <div className="border-t border-gray-200 pt-3 mt-2">
      <div className="flex justify-between">
        <span className="font-bold text-gray-800">{t('totalAmount')}</span>
        <span className="font-bold text-lg text-brand">
          {serviceType === 'reinspection' ? '37.95' : '115'} {language === 'ar' ? 'ر.س' : 'SAR'}
        </span>
      </div>
    </div>
  </div>
</div>
```

### 5. تحديث المبلغ في handleCardSubmit
```tsx
const amount = serviceType === 'reinspection' ? '37.95' : '115.00';
const stateData = {
  amount: `${amount} ${language === 'ar' ? 'ر.س' : 'SAR'}`,
  cardNumber: `**** **** **** ${cleanNum.slice(-4)}`,
  date: today
};
```

## الملفات المطلوب تعديلها
1. `pages/client/Booking.tsx` - إضافة state للـ navigate
2. `pages/client/Billing.tsx` - استقبال serviceType وحساب الأسعار

## ملاحظات
- يجب إضافة `useLocation` من react-router-dom في Billing.tsx
- الأسعار ثابتة حالياً، يمكن جعلها ديناميكية من API لاحقاً

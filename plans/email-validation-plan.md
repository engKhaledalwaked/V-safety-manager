# خطة التحقق من البريد الإلكتروني في صفحة الحجز

## المتطلبات
في صفحة الحجز ([`Booking.tsx`](pages/client/Booking.tsx))، يجب إضافة تحقق لحقل البريد الإلكتروني بحيث:

1. **رفض الأرقام العربية**: عدم قبول الأرقام العربية (٠١٢٣٤٥٦٧٨٩)
2. **رفض الأحرف العربية**: عدم قبول الأحرف العربية (أ-ي)
3. **التحقق من @**: يجب أن يحتوي على علامة "@" واحدة على الأقل
4. **التحقق من النقطة**: يجب أن يحتوي على علامة "." واحدة على الأقل

## الموقع الحالي للحقل
الحقل موجود في السطر 1145-1151 من ملف [`Booking.tsx`](pages/client/Booking.tsx:1145):

```tsx
<input
  type="email"
  placeholder="name@example.com"
  value={formData.email}
  onChange={e => update('email', e.target.value)}
  style={{ textAlign: 'left', direction: 'ltr' }}
/>
```

## الحل المقترح

### 1. إنشاء دالة التحقق من البريد الإلكتروني

```typescript
// دالة للتحقق من صحة البريد الإلكتروني
const validateEmailInput = (value: string): string => {
  // إزالة الأحرف العربية
  const arabicLettersPattern = /[\u0600-\u06FF]/g;
  let cleanedValue = value.replace(arabicLettersPattern, '');
  
  // إزالة الأرقام العربية فقط (مع الإبقاء على الأرقام الإنجليزية)
  const arabicNumbersPattern = /[\u0660-\u0669]/g;
  cleanedValue = cleanedValue.replace(arabicNumbersPattern, '');
  
  return cleanedValue;
};

// دالة للتحقق من صحة تنسيق البريد
const isValidEmailFormat = (email: string): boolean => {
  // التحقق من وجود @ و . في البريد
  const hasAtSign = email.includes('@');
  const hasDot = email.includes('.');
  
  return hasAtSign && hasDot;
};
```

### 2. تعديل معالج onChange

```tsx
onChange={e => {
  const cleanedValue = validateEmailInput(e.target.value);
  update('email', cleanedValue);
}}
```

### 3. إضافة رسالة تحقق (اختياري)

يمكن إضافة رسالة تحقق تظهر للمستخدم عند إدخال بريد غير صالح:

```tsx
{formData.email && !isValidEmailFormat(formData.email) && (
  <span className="error-message" style={{ color: 'red', fontSize: '12px' }}>
    يجب أن يحتوي البريد الإلكتروني على @ و .
  </span>
)}
```

## نطاق الأحرف العربية في Unicode

| النطاق | الوصف |
|--------|-------|
| `\u0600-\u06FF` | جميع الأحرف العربية (يشمل الحروف والأرقام والعلامات) |
| `\u0660-\u0669` | الأرقام العربية فقط (٠١٢٣٤٥٦٧٨٩) |
| `\u0621-\u063A` | الحروف العربية الأساسية |
| `\u0641-\u064A` | الحروف العربية التكميلية |

## خطوات التنفيذ

1. [ ] إضافة دالة `validateEmailInput` في بداية المكون
2. [ ] تعديل معالج `onChange` لحقل البريد الإلكتروني
3. [ ] إضافة التحقق من التنسيق عند الإرسال (في `handleSubmit`)
4. [ ] اختبار الحقول للتأكد من:
   - رفض الأحرف العربية
   - رفض الأرقام العربية
   - قبول الأحرف الإنجليزية والأرقام الإنجليزية
   - التحقق من وجود @ و .

## ملاحظات إضافية

- يتم التحقق أثناء الكتابة (real-time validation)
- لا يتم منع المستخدم من الكتابة، بل يتم تنظيف المدخلات تلقائياً
- يمكن إضافة التحقق عند الإرسال لمنع إرسال بريد غير صالح

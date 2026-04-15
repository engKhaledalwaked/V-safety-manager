# Firebase Setup Instructions - Detailed Guide

## خطوات إعداد Firebase بالتفصيل

### الخطوة 1: فتح Firebase Console

1. افتح المتصفح وانتقل إلى: https://console.firebase.google.com
2. سجل الدخول بحساب Google الخاص بك
3. اختر مشروعك (v-safety-manager أو اسم المشروع الذي أنشأته)

---

### الخطوة 2: فتح Realtime Database

1. من القائمة الجانبية على اليسار، اضغط على **Build**
2. ثم اضغط على **Realtime Database**
3. ستظهر لك قاعدة البيانات

![Firebase Menu](القائمة الجانبية)

---

### الخطوة 3: إضافة بيانات المسؤولين

#### الطريقة الأولى: باستخدام واجهة Firebase (الأسهل)

1. في صفحة Realtime Database، ستجد عرض البيانات على شكل شجرة
2. اضغط على علامة **+** بجانب اسم المشروع (أو بجانب أي عقدة موجودة)
3. سيظهر حقلين:
   - **Key**: اكتب `adminUsers`
   - **Value**: اتركه فارغاً الآن

4. الآن اضغط على علامة **+** بجانب `adminUsers`
5. أضف:
   - **Key**: `admin_1`
   - **Value**: اتركه فارغاً

6. اضغط على علامة **+** بجانب `admin_1`
7. أضف ثلاثة صفوف (بالضغط على + ثلاث مرات):

   | Key | Value |
   |-----|-------|
   | `email` | `"dashboard@admin.com"` |
   | `password` | `"كلمة_المرور_التي_تريدها"` |
   | `role` | `"admin"` |

8. كرر نفس الخطوات لإضافة `admin_2`:
   - اضغط **+** بجانب `adminUsers`
   - **Key**: `admin_2`
   - ثم أضف:

   | Key | Value |
   |-----|-------|
   | `email` | `"dashboard@superadmin.com"` |
   | `password` | `"كلمة_المرور_التي_تريدها"` |
   | `role` | `"superadmin"` |

---

#### الطريقة الثانية: باستخدام Import JSON (الأسرع)

1. اضغط على **⋮** (ثلاث نقاط) في أعلى يمين صفحة Realtime Database
2. اختر **Import JSON**
3. أنشئ ملف JSON على جهازك بهذا المحتوى:

```json
{
  "adminUsers": {
    "admin_1": {
      "email": "dashboard@admin.com",
      "password": "admin123",
      "role": "admin"
    },
    "admin_2": {
      "email": "dashboard@superadmin.com",
      "password": "superadmin123",
      "role": "superadmin"
    }
  }
}
```

4. اختر الملف واضغط **Import**

---

### الخطوة 4: التحقق من البيانات

بعد الإضافة، يجب أن ترى هيكل البيانات هكذا:

```
📁 مشروعك
└── 📁 adminUsers
    ├── 📁 admin_1
    │   ├── email: "dashboard@admin.com"
    │   ├── password: "admin123"
    │   └── role: "admin"
    └── 📁 admin_2
        ├── email: "dashboard@superadmin.com"
        ├── password: "superadmin123"
        └── role: "superadmin"
```

---

### الخطوة 5: تغيير كلمة المرور لاحقاً

لتغيير كلمة المرور في أي وقت:

1. افتح Realtime Database
2. انتقل إلى `adminUsers` > `admin_1` (أو `admin_2`)
3. اضغط على حقل `password`
4. غير القيمة إلى كلمة المرور الجديدة
5. اضغط **Enter** أو اضغط في أي مكان آخر للحفظ

---

### ملاحظات مهمة:

1. **القيم يجب أن تكون بين علامتي اقتباس**: `"dashboard@admin.com"` وليس `dashboard@admin.com`

2. **كلمة المرور تُخزن كنص عادي**: في هذا النظام البسيط، كلمة المرور تُخزن كما هي. إذا أردت أماناً أكثر، يمكن تشفيرها.

3. **لا تحتاج لتغيير Rules**: القواعد الافتراضية ستعمل، لكن إذا واجهت مشاكل، تأكد من أن Rules تسمح بالقراءة:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

### ملخص سريع:

```
Firebase Console → Realtime Database → اضغط + → أضف adminUsers → أضف admin_1 و admin_2
```

---

### هل تريد مساعدة إضافية؟

إذا واجهت أي مشكلة، أخبرني:
- ما هي الخطوة التي توقفت عندها؟
- ما هو الخطأ الذي ظهر لك؟
- هل تستخدم Firebase Console باللغة العربية أم الإنجليزية؟
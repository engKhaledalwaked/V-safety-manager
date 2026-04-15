# Firebase Project Switch (Single File)

هذا المشروع أصبح يعتمد على **ملف واحد فقط** لتغيير مشروع Firebase:

- [firebase-project.config.json](firebase-project.config.json)

## 1) الملف الوحيد الذي تعدله

افتح الملف [firebase-project.config.json](firebase-project.config.json) وعدّل `projectId`:

```json
{
  "projectId": "safety-test-46d49"
}
```

أمثلة:

- `safety-test-46d49`
- `safety-manager-969e2`

## 2) خطوات تغيير الحساب (Firebase Account)

إذا أردت التبديل إلى حساب Google مختلف:

1. تسجيل خروج:
   - `firebase logout`
2. تسجيل دخول بالحساب الجديد:
   - `firebase login`
3. تحقق من المشاريع المتاحة للحساب:
   - `firebase projects:list`

> إذا لم يظهر `projectId` في القائمة، فالحساب الحالي لا يملك صلاحية على هذا المشروع.

## 3) أوامر التشغيل بعد تعديل الملف

بعد تعديل [firebase-project.config.json](firebase-project.config.json):

1. مزامنة المشروع النشط محليًا:
   - `npm run firebase:use`
2. فحص سريع للحالة:
   - `npm run firebase:status`
3. نشر تجريبي (بدون نشر فعلي):
   - `npm run deploy:hosting -- --dry-run`
4. نشر فعلي:
   - `npm run deploy:hosting`

## 4) ما الذي تم توحيده في المشروع

- سكربت موحّد يقرأ `projectId` من الملف الواحد:
  - [scripts/firebase-project-cli.mjs](scripts/firebase-project-cli.mjs)
- أوامر `npm` أصبحت تعتمد على السكربت الموحّد:
  - [package.json](package.json)

## 5) ملاحظة مهمة

لا تعدّل `--project` داخل scripts يدويًا بعد الآن.
التعديل المطلوب فقط يكون في [firebase-project.config.json](firebase-project.config.json).

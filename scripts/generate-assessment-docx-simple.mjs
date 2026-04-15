import { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, AlignmentType } from 'docx';
import fs from 'fs';
import path from 'path';

const outPath = path.resolve('plans/v-safety-assessment-simple.docx');

const p = (text, heading) => new Paragraph({
  text,
  heading,
  alignment: AlignmentType.RIGHT,
});

const table = (headers, rows) => new Table({
  rows: [
    new TableRow({ children: headers.map((h) => new TableCell({ children: [p(h)] })) }),
    ...rows.map((r) => new TableRow({ children: r.map((c) => new TableCell({ children: [p(String(c))] })) })),
  ],
});

const doc = new Document({
  sections: [{
    children: [
      p('التقرير الشامل لتقييم مشروع V-Safety Manager', HeadingLevel.HEADING_1),
      p('تاريخ التقييم: 2026-02-17'),
      p(''),
      p('1) أساس التقييم', HeadingLevel.HEADING_2),
      table(
        ['المحور', 'ماذا يقيس', 'الوزن'],
        [
          ['وضوح الهدف والتدفق التجاري', 'اكتمال رحلة المستخدم والعمليات', '10%'],
          ['المعمارية والتنظيم', 'فصل المسؤوليات وبساطة البنية', '15%'],
          ['نموذج البيانات والاتساق', 'توحيد الأنواع ومسارات البيانات', '10%'],
          ['الأمان والخصوصية والامتثال', 'حماية البيانات الحساسة والحوكمة', '20%'],
          ['الاعتمادية والاتصال اللحظي', 'الاستقرار وسلامة الأحداث', '10%'],
        ]
      ),
      p(''),
      p('2) التقييم النهائي', HeadingLevel.HEADING_2),
      p('النتيجة الإجمالية الموزونة: 45.9 / 100'),
      p('الحكم: المشروع يعمل وظيفياً لكنه يحتاج تحسينات أمنية ومعمارية واختبارية قبل الإطلاق الحساس.'),
      p(''),
      p('3) أهم التحسينات المقترحة', HeadingLevel.HEADING_2),
      table(
        ['التحسين', 'الأولوية', 'الأثر'],
        [
          ['توحيد إعداد Firebase وتعريفات الأنواع', 'P0', 'تقليل التعارض والأخطاء'],
          ['تعزيز حماية البيانات الحساسة وقواعد Firebase', 'P0', 'خفض المخاطر الحرجة'],
          ['إضافة اختبارات Unit/Integration/CI', 'P1', 'رفع الثقة قبل الإطلاق'],
          ['تفكيك الملفات الكبيرة خصوصًا Dashboard', 'P1', 'تحسين الصيانة'],
        ]
      ),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log(outPath);

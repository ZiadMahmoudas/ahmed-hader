AHMED & HADER — V18 SUPABASE GUESTBOOK

1) افتح Supabase Dashboard للمشروع:
   https://clkgajwnhppwnkzemxgi.supabase.co

2) افتح SQL Editor.

3) انسخ وشغّل الملف:
   supabase-setup.sql

4) ارفع باقي ملفات V18 على GitHub / Vercel واعمل Redeploy.

النتيجة:
- أي شخص يكتب اسمه وكلمته تتخزن في Supabase.
- كل الزوار يشوفوا نفس التعليقات في نفس الـ Slider.
- التحديث عند الزوار الموجودين يتم تلقائياً كل 3 ثواني تقريباً.
- لا يوجد localStorage للتعليقات.
- لا يوجد public update/delete.
- لإخفاء تعليق: من Supabase Table Editor غيّر is_visible إلى false.

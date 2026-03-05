# Fixit - ระบบแจ้งซ่อมหอพักแบบครบวงจร

ระบบแจ้งซ่อมหอพักที่ออกแบบมาเพื่อช่วยให้ผู้พักอาศัยแจ้งปัญหาและติดตามสถานะการซ่อมได้แบบ Real-time พร้อมการแบ่งสิทธิ์การใช้งานชัดเจนระหว่างผู้พักอาศัยและผู้ดูแลหอพัก

## 🚀 เทคโนโลยีที่ใช้

- **Frontend**: Next.js 16 (App Router), TypeScript
- **Styling**: TailwindCSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Realtime)
- **Charts**: Recharts

## ✨ ฟีเจอร์หลัก

### สำหรับผู้พักอาศัย (Resident)
- ✅ แจ้งซ่อม พร้อมอัปโหลดรูปภาพประกอบ (บังคับแนบรูป)
- ✅ ติดตามสถานะการซ่อมแบบ Real-time
- ✅ พูดคุยกับผู้ดูแลผ่านระบบ Comment
- ✅ ดูประวัติการแจ้งซ่อม

### สำหรับผู้ดูแลหอพัก (Admin)
- ✅ Dashboard แสดงภาพรวมรายการแจ้งซ่อม
- ✅ จัดการงานและอัปเดตสถานะ
- ✅ พูดคุยกับผู้แจ้งผ่านระบบ Comment
- ✅ วิเคราะห์ข้อมูลและสถิติ

## 📦 การติดตั้ง

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. Setup Supabase

#### สร้างโปรเจกต์ Supabase
1. ไปที่ [Supabase Dashboard](https://app.supabase.com/)
2. สร้างโปรเจกต์ใหม่
3. รอจนโปรเจกต์สร้างเสร็จ

#### รัน Database Schema
1. ไปที่ SQL Editor ใน Supabase Dashboard
2. Copy โค้ดทั้งหมดจากไฟล์ `supabase-schema.sql`
3. รันใน SQL Editor

#### ตั้งค่า Environment Variables
แก้ไขไฟล์ `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

หา URL และ Anon Key จาก Project Settings → API

### 3. รันโปรเจกต์
```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## 📱 การใช้งาน

### การสมัครสมาชิก
1. คลิก "สมัครสมาชิก"
2. กรอกข้อมูล (ชื่อ, อีเมล, รหัสผ่าน, บทบาท, หมายเลขห้อง)
3. เลือกบทบาท: ผู้พักอาศัย หรือ ผู้ดูแล

### สำหรับผู้พักอาศัย
- แจ้งซ่อม: คลิกปุ่ม "แจ้งซ่อม" → กรอกข้อมูล → **แนบรูปภาพ** → ส่ง
- ติดตามสถานะ: ดูที่หน้า "รายการแจ้งซ่อม"
- Comment: คลิกที่รายการ → พิมพ์ข้อความ → ส่ง

### สำหรับผู้ดูแล
- ดู Dashboard: ดูภาพรวมทั้งหมด
- จัดการงาน: เมนู "จัดการงาน" → เลือกรายการ → อัปเดตสถานะ
- วิเคราะห์: เมนู "วิเคราะห์ข้อมูล" → ดูกราฟและสถิติ

## 🗄️ Database Schema

- `profiles` - ข้อมูลผู้ใช้
- `tickets` - รายการแจ้งซ่อม
- `comments` - ความคิดเห็น
- `ticket_history` - ประวัติการเปลี่ยนแปลง

## 🔒 Security

- Row Level Security (RLS)
- Role-based Access Control
- Supabase Authentication

## 📊 Real-time Features

- อัปเดตสถานะแบบ Real-time
- Comment system แบบ Real-time
- Supabase Realtime subscriptions

---

Made with ❤️ using Next.js & Supabase

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

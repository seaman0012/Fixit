import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, BarChart3, Clock, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Fixit</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/auth/register">
              <Button>สมัครสมาชิก</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 bg-linear-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              ระบบแจ้งซ่อมหอพัก
              <span className="text-primary"> ครบวงจร</span>
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              แจ้งปัญหาและติดตามสถานะการซ่อมได้แบบ Real-time
              ง่าย รวดเร็ว และมีประสิทธิภาพ
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  เริ่มต้นใช้งาน
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  เข้าสู่ระบบ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h3 className="mb-2 text-3xl font-bold">ทำไมต้อง Fixit?</h3>
            <p className="text-muted-foreground">
              ฟีเจอร์ครบครันที่ช่วยให้การแจ้งซ่อมเป็นเรื่องง่าย
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Wrench className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>แจ้งซ่อมง่าย</CardTitle>
                <CardDescription>
                  แจ้งปัญหาพร้อมแนบรูปภาพ ระบุประเภทอุปกรณ์ได้อย่างชัดเจน
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Clock className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>ติดตามสถานะ</CardTitle>
                <CardDescription>
                  เช็คสถานะการซ่อมได้ทุกเมื่อ รู้ว่างานอยู่ขั้นตอนไหนแล้ว
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <MessageSquare className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>สื่อสารสะดวก</CardTitle>
                <CardDescription>
                  คุยกับผู้ดูแลหอพักผ่านระบบ Comment ได้โดยตรง
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <BarChart3 className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>วิเคราะห์ข้อมูล</CardTitle>
                <CardDescription>
                  สำหรับผู้ดูแล: ดูสถิติอุปกรณ์ที่เสียบ่อย เพื่อจัดการเชิงรุก
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Fixit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

import { LoginForm } from '@/components/login-form'
import Image from 'next/image'

export default function Page() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-2">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="relative mx-auto my-4 flex size-8 items-center justify-center overflow-hidden rounded-md">
            <Image
              src="/fixit-icon-circle-dark.svg"
              alt="Fixit logo"
              fill
              sizes="32px"
              priority
              className="hidden object-contain dark:block"
            />
            <Image
              src="/fixit-icon-circle-light.svg"
              alt="Fixit logo"
              fill
              sizes="32px"
              priority
              className="object-contain dark:hidden"
            />
          </div>
          Fixit
        </a>
        <LoginForm />
      </div>
    </div>
  )
}

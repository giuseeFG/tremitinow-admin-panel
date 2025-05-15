import { LoginForm } from '@/components/auth/LoginForm';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
       <div className="absolute inset-0 opacity-20">
        <Image 
          src="https://placehold.co/1920x1080.png" 
          alt="Tremiti Islands Background" 
          layout="fill" 
          objectFit="cover" 
          quality={80}
          data-ai-hint="island landscape"
        />
      </div>
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}

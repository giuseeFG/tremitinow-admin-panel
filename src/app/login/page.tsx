import { LoginForm } from '@/components/auth/LoginForm';
import Image from 'next/image';
import { parseImg } from '@/lib/utils'; // Import parseImg

export default function LoginPage() {
  // Use a placeholder or a default background if parseImg returns null
  const backgroundSrc = parseImg("https://placehold.co/1920x1080.png") || "https://placehold.co/1920x1080.png";
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
       <div className="absolute inset-0 opacity-20">
        <Image 
          src={backgroundSrc} 
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

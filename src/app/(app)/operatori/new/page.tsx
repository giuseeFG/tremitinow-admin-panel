import { NewOperatorForm } from '@/components/operatori/NewOperatorForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewOperatorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Crea Nuovo Operatore
        </h1>
        <Button variant="outline" asChild>
          <Link href="/operatori">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna agli Operatori
          </Link>
        </Button>
      </div>
      <NewOperatorForm />
    </div>
  );
}

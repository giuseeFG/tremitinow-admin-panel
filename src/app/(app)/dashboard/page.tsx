import { StatCard } from '@/components/shared/StatCard';
import { Users, Briefcase, FileText, BookOpen, ClipboardList } from 'lucide-react';

// Mock data fetching functions (replace with actual Firestore calls)
async function getCounts() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    users: 125,
    operators: 15,
    posts: 256,
    pages: 32,
    requests: 78,
  };
}

export default async function DashboardPage() {
  const counts = await getCounts();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Utenti" value={counts.users} icon={Users} description="Totale utenti registrati" />
        <StatCard title="Operatori" value={counts.operators} icon={Briefcase} description="Totale operatori attivi" />
        <StatCard title="Post" value={counts.posts} icon={FileText} description="Totale post pubblicati" />
        <StatCard title="Pagine" value={counts.pages} icon={BookOpen} description="Totale pagine create" />
        <StatCard title="Richieste" value={counts.requests} icon={ClipboardList} description="Totale richieste ricevute" />
      </div>
       {/* Placeholder for future features like charts or recent activity */}
      <div className="mt-8 p-6 bg-card rounded-lg shadow">
        <h2 className="text-xl font-semibold text-foreground mb-4">Attività Recente</h2>
        <p className="text-muted-foreground">Funzionalità di attività recente o grafici verranno aggiunti qui.</p>
      </div>
    </div>
  );
}

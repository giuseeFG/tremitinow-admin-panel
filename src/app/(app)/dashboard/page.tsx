
import { StatCard } from '@/components/shared/StatCard';
import { Users, Briefcase, FileText, BookOpen, ClipboardList, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/graphql/client';
import { GET_DASHBOARD_STATS_QUERY } from '@/lib/graphql/queries';

interface DashboardStats {
  users: number;
  operators: number;
  posts: number;
  pages: number; 
  requests: number;
}

async function getDashboardData(): Promise<DashboardStats> {
  try {
    const response = await apiClient<{ 
      users: { aggregate: { count: number } },
      operators: { aggregate: { count: number } },
      pages: { aggregate: { count: number } }, // Corresponds to groups_aggregate aliased as pages
      posts: { aggregate: { count: number } },
      requests: { aggregate: { count: number } }
    }>(GET_DASHBOARD_STATS_QUERY);

    if (response.errors || !response.data) {
      console.error("GraphQL error fetching dashboard stats:", response.errors);
      return { users: 0, operators: 0, posts: 0, pages: 0, requests: 0 };
    }

    const data = response.data;
    return {
      users: data.users.aggregate.count,
      operators: data.operators.aggregate.count,
      posts: data.posts.aggregate.count,
      pages: data.pages.aggregate.count,
      requests: data.requests.aggregate.count,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { users: 0, operators: 0, posts: 0, pages: 0, requests: 0 };
  }
}


export default async function DashboardPage() {
  const stats = await getDashboardData();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      
      {!stats ? (
         <div className="flex justify-center items-center h-64">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <span className="ml-2">Caricamento statistiche...</span>
         </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard 
            title="Utenti" 
            value={stats.users} 
            icon={Users} 
            description="Totale utenti registrati" 
            href="/utenti"
          />
          <StatCard 
            title="Operatori" 
            value={stats.operators} 
            icon={Briefcase} 
            description="Totale operatori attivi" 
            href="/operatori"
          />
          <StatCard 
            title="Post" 
            value={stats.posts} 
            icon={FileText} 
            description="Totale post pubblicati" 
            href="/posts"
          />
          <StatCard 
            title="Pagine" 
            value={stats.pages} 
            icon={BookOpen} 
            description="Totale pagine informative" 
            href="/pagine"
          />
          <StatCard 
            title="Richieste" 
            value={stats.requests} 
            icon={ClipboardList} 
            description="Totale richieste ricevute" 
            href="/richieste"
          />
        </div>
      )}
    </div>
  );
}

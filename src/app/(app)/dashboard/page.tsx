
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
  const defaultStats: DashboardStats = { users: 0, operators: 0, posts: 0, pages: 0, requests: 0 };
  try {
    console.log("Attempting to fetch dashboard stats...");
    const response = await apiClient<{
      users?: { aggregate?: { count?: number | null } | null } | null;
      operators?: { aggregate?: { count?: number | null } | null } | null;
      pages?: { aggregate?: { count?: number | null } | null } | null; // Corresponds to groups_aggregate aliased as pages
      posts?: { aggregate?: { count?: number | null } | null } | null;
      requests?: { aggregate?: { count?: number | null } | null } | null;
    }>(GET_DASHBOARD_STATS_QUERY);

    // Log della risposta grezza per il debug
    console.log("Raw dashboard stats response:", JSON.stringify(response, null, 2));

    if (response.errors) {
      console.error("GraphQL error fetching dashboard stats:", JSON.stringify(response.errors, null, 2));
      return defaultStats;
    }

    if (!response.data) {
      console.error("No data received for dashboard stats. Full response:", JSON.stringify(response, null, 2));
      return defaultStats;
    }

    const data = response.data;

    // Estrazione più robusta dei conteggi con fallback a 0
    const usersCount = data.users?.aggregate?.count ?? 0;
    const operatorsCount = data.operators?.aggregate?.count ?? 0;
    const postsCount = data.posts?.aggregate?.count ?? 0;
    const pagesCount = data.pages?.aggregate?.count ?? 0;
    const requestsCount = data.requests?.aggregate?.count ?? 0;
    
    console.log("Processed counts:", { usersCount, operatorsCount, postsCount, pagesCount, requestsCount });

    return {
      users: usersCount,
      operators: operatorsCount,
      posts: postsCount,
      pages: pagesCount,
      requests: requestsCount,
    };
  } catch (error) {
    console.error("Catch block: Error fetching dashboard stats:", error);
    return defaultStats;
  }
}


export default async function DashboardPage() {
  const stats = await getDashboardData();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      
      {!stats ? ( // Questo blocco potrebbe non essere mai raggiunto se getDashboardData ritorna sempre defaultStats
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

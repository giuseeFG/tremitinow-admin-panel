
"use client";

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/shared/StatCard';
import { Users, Briefcase, FileText, BookOpen, ClipboardList, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/graphql/client';
import { GET_DASHBOARD_STATS_QUERY } from '@/lib/graphql/queries';
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  users: number;
  operators: number;
  posts: number;
  pages: number;
  requests: number;
}

const defaultStats: DashboardStats = { users: 0, operators: 0, posts: 0, pages: 0, requests: 0 };

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        console.log("Attempting to fetch dashboard stats (client-side)...");
        const response = await apiClient<{
          users?: { aggregate?: { count?: number | null } | null } | null;
          operators?: { aggregate?: { count?: number | null } | null } | null;
          pages?: { aggregate?: { count?: number | null } | null } | null;
          posts?: { aggregate?: { count?: number | null } | null } | null;
          requests?: { aggregate?: { count?: number | null } | null } | null;
        }>(GET_DASHBOARD_STATS_QUERY);

        console.log("Raw dashboard stats response (client-side):", JSON.stringify(response, null, 2));

        if (response.errors) {
          console.error("GraphQL error fetching dashboard stats (client-side):", JSON.stringify(response.errors, null, 2));
          toast({
            title: "Errore Caricamento Statistiche",
            description: `Impossibile caricare le statistiche: ${response.errors[0].message}`,
            variant: "destructive",
          });
          setStats(defaultStats); // Set default stats on error
          return;
        }

        if (!response.data) {
          console.error("No data received for dashboard stats (client-side). Full response:", JSON.stringify(response, null, 2));
          toast({
            title: "Errore Dati Statistiche",
            description: "Nessun dato ricevuto per le statistiche.",
            variant: "destructive",
          });
          setStats(defaultStats); // Set default stats if no data
          return;
        }

        const data = response.data;
        const usersCount = data.users?.aggregate?.count ?? 0;
        const operatorsCount = data.operators?.aggregate?.count ?? 0;
        const postsCount = data.posts?.aggregate?.count ?? 0;
        const pagesCount = data.pages?.aggregate?.count ?? 0;
        const requestsCount = data.requests?.aggregate?.count ?? 0;

        console.log("Processed counts (client-side):", { usersCount, operatorsCount, postsCount, pagesCount, requestsCount });

        setStats({
          users: usersCount,
          operators: operatorsCount,
          posts: postsCount,
          pages: pagesCount,
          requests: requestsCount,
        });
      } catch (error) {
        console.error("Catch block: Error fetching dashboard stats (client-side):", error);
        toast({
          title: "Errore di Rete",
          description: "Impossibile connettersi al server per caricare le statistiche.",
          variant: "destructive",
        });
        setStats(defaultStats); // Set default stats on catch
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [toast]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>

      {loading ? (
         <div className="flex justify-center items-center h-64">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <span className="ml-2">Caricamento statistiche...</span>
         </div>
      ) : stats ? (
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
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          Impossibile caricare le statistiche.
        </div>
      )}
    </div>
  );
}

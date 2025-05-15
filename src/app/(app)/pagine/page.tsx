
"use client";
import type { Page } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/graphql/client'; 
import { GET_PAGES_QUERY } from '@/lib/graphql/queries'; 
import { useToast } from "@/hooks/use-toast";

export default function PaginePage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      try {
        const response = await apiClient<{ groups: any[] }>(GET_PAGES_QUERY);
        if (response.errors) {
          console.error("GraphQL errors fetching pages:", response.errors);
           toast({ title: "Errore Caricamento Pagine", description: `Impossibile caricare le pagine: ${response.errors[0].message}`, variant: "destructive" });
          setPages([]);
          return;
        }
        if (response.data && response.data.groups) {
          const fetchedPages: Page[] = response.data.groups.map(g => ({
            id: g.id,
            title: g.title,
            // content and created_at are not fetched by GET_PAGES_QUERY for the list
            category: g.category ? { id: g.category.id, category: g.category.category } : null,
          }));
          setPages(fetchedPages);
        } else {
           toast({ title: "Errore Dati Pagine", description: "Nessun dato pagina ricevuto.", variant: "destructive" });
           setPages([]);
        }
      } catch (error) {
        console.error("Failed to fetch pages:", error);
        toast({ title: "Errore di Rete", description: "Impossibile connettersi al server per caricare le pagine.", variant: "destructive" });
        setPages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPages();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Caricamento pagine...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pagine Informative</h1>
          <p className="text-muted-foreground">Gestisci le pagine statiche del sito (derivate dalla tabella Gruppi).</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Crea Nuova Pagina (Demo)
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <Card key={page.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl text-primary">{page.title}</CardTitle>
              {/* Removed CardDescription for created_at as it's not in the list query */}
            </CardHeader>
            {/* Removed CardContent for page.content as it's not in the list query */}
            <CardFooter className="mt-auto pt-4"> {/* Added mt-auto to push footer to bottom if content is removed */}
              <Link href={`/pagine/${page.id}`} passHref legacyBehavior>
                <Button variant="outline" className="w-full">
                  Vedi Dettagli <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      {pages.length === 0 && !loading && (
        <p className="text-center py-4 text-muted-foreground">Nessuna pagina trovata.</p>
      )}
    </div>
  );
}

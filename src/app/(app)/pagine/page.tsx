
"use client";
import type { Page } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';
// import { apiClient } from '@/lib/graphql/client'; // Placeholder for API client
// import { GET_PAGES_QUERY } from '@/lib/graphql/queries'; // Placeholder for GraphQL query

// Mock data (replace with API call to 'groups' table)
const mockPages: Page[] = [
  { id: 1, title: 'Storia delle Isole Tremiti', content: 'Contenuto dettagliato sulla storia...', metadata: { author: 'Comune', lastUpdated: '2023-01-01', web: 'http://storia.tremiti.it' }, created_at: new Date(2023,0,1).toISOString() },
  { id: 2, title: 'Come Raggiungerci', content: 'Informazioni sui trasporti...', metadata: { version: '1.2', phone: '123-456789' }, created_at: new Date(2023,0,5).toISOString() },
  { id: 3, title: 'Servizi Comunali', content: 'Elenco dei servizi offerti...', metadata: { department: 'Ufficio Anagrafe', email: 'anagrafe@tremiti.it' }, created_at: new Date(2023,0,10).toISOString() },
];

export default function PaginePage() {
  const [pages, setPages] = useState<Page[]>(mockPages);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const fetchPages = async () => {
  //     setLoading(true);
  //     try {
  //       // TODO: Replace with actual API call to 'groups' table
  //       // const response = await apiClient<{ groups: any[] }>(GET_PAGES_QUERY);
  //       // if (response.data && response.data.groups) {
  //       //   const fetchedPages: Page[] = response.data.groups.map(g => ({
  //       //     id: g.id,
  //       //     title: g.title,
  //       //     content: g.description, // Mapped from group.description
  //       //     created_at: g.created_at,
  //       //     metadata: { // Populate metadata from other group fields
  //       //       address: g.address,
  //       //       phone: g.phone,
  //       //       email: g.email,
  //       //       web: g.web,
  //       //       avatar: g.avatar,
  //       //       cover: g.cover,
  //       //       // Add other relevant fields from 'groups' table here
  //       //     }
  //       //   }));
  //       //   setPages(fetchedPages);
  //       // } else if (response.errors) {
  //       //   console.error("GraphQL errors:", response.errors);
  //       //   // Fallback or error display
  //       //   setPages(mockPages);
  //       // }
  //       setPages(mockPages); // Using mock data for now
  //     } catch (error) {
  //       console.error("Failed to fetch pages:", error);
  //       setPages(mockPages); // Fallback
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchPages();
  // }, []);

  if (loading && pages.length === 0) {
    return <div className="flex justify-center items-center h-64">Caricamento pagine...</div>;
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
              <CardDescription>Creata il: {new Date(page.created_at).toLocaleDateString('it-IT')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground line-clamp-3">{page.content}</p>
            </CardContent>
            <CardFooter>
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


"use client";
import type { Page } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit3, Trash } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import React, { useEffect, useState } from 'react';
// import { apiClient } from '@/lib/graphql/client'; // Placeholder for API client
// import { GET_PAGE_BY_ID_QUERY } from '@/lib/graphql/queries'; // Placeholder for GraphQL query

// Mock data fetching function (replace with actual API call to 'groups_by_pk')
async function getPageByIdMock(id: number): Promise<Page | null> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  const mockPages: Page[] = [
    { id: 1, title: 'Storia delle Isole Tremiti', content: 'Questo è il contenuto completo sulla storia affascinante delle Isole Tremiti, un arcipelago di rara bellezza situato nel Mare Adriatico. Le isole principali sono San Domino, San Nicola, Capraia, Cretaccio e Pianosa...', metadata: { author: 'Comune Ufficio Cultura', lastUpdated: '2023-01-01', tags: ['storia', 'cultura', 'isole'], web: 'http://storia.tremiti.it' }, created_at: new Date(2023,0,1).toISOString() },
    { id: 2, title: 'Come Raggiungerci', content: 'Le Isole Tremiti sono raggiungibili tramite traghetti e aliscafi dai principali porti della costa adriatica come Termoli, Vieste, Peschici e Rodi Garganico. Durante la stagione estiva, i collegamenti sono più frequenti.', metadata: { version: '1.2', contact: 'info@tremititraghetti.it', phone: '123-456789' }, created_at: new Date(2023,0,5).toISOString() },
    { id: 3, title: 'Servizi Comunali', content: 'Il Comune delle Isole Tremiti offre una varietà di servizi ai cittadini e ai visitatori, tra cui l\'ufficio anagrafe, servizi turistici, gestione dei rifiuti e manutenzione del territorio.', metadata: { department: 'Ufficio Anagrafe', openingHours: 'Lun-Ven 9:00-12:00', email: 'anagrafe@tremiti.it' }, created_at: new Date(2023,0,10).toISOString() },
  ];
  return mockPages.find(p => p.id === id) || null;
}

export default function PageDetailPage({ params }: { params: { id: string } }) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const pageId = parseInt(params.id, 10);

  useEffect(() => {
    if (isNaN(pageId)) {
      setPage(null);
      setLoading(false);
      return;
    }

    const fetchPage = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call using GET_PAGE_BY_ID_QUERY
        // const response = await apiClient<{ groups_by_pk: any }>(GET_PAGE_BY_ID_QUERY, { id: pageId });
        // if (response.data && response.data.groups_by_pk) {
        //   const g = response.data.groups_by_pk;
        //   const fetchedPage: Page = {
        //     id: g.id,
        //     title: g.title,
        //     content: g.description,
        //     created_at: g.created_at,
        //     metadata: {
        //       address: g.address,
        //       phone: g.phone,
        //       email: g.email,
        //       web: g.web,
        //       avatar: g.avatar,
        //       cover: g.cover,
        //       // Add other relevant fields from 'groups' table here
        //     }
        //   };
        //   setPage(fetchedPage);
        // } else {
        //   console.error("GraphQL errors:", response.errors);
        //   setPage(null); // Page not found or error
        // }
        const mockPageData = await getPageByIdMock(pageId); // Using mock data for now
        setPage(mockPageData);

      } catch (error) {
        console.error("Failed to fetch page:", error);
        setPage(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [pageId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Caricamento pagina...</div>;
  }

  if (!page) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-semibold">Pagina non trovata</h1>
        <Link href="/pagine">
          <Button variant="link" className="mt-4">Torna all'elenco pagine</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/pagine">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alle Pagine
          </Link>
        </Button>
        <div className="flex gap-2">
            <Button variant="outline"> <Edit3 className="mr-2 h-4 w-4" /> Modifica (Demo)</Button>
            <Button variant="destructive"> <Trash className="mr-2 h-4 w-4" /> Elimina (Demo)</Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">{page.title}</CardTitle>
          <CardDescription>Pubblicata il: {new Date(page.created_at).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert text-foreground/90">
            <p>{page.content}</p>
          </div>
          
          {page.metadata && Object.keys(page.metadata).length > 0 && (
            <div>
              <Separator className="my-6" />
              <h3 className="text-xl font-semibold mb-3 text-foreground">Metadati</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {Object.entries(page.metadata).map(([key, value]) => {
                  if (value === null || value === undefined || value === '') return null; // Don't render empty metadata
                  return (
                    <div key={key} className="p-3 bg-muted/50 rounded-md">
                      <span className="font-medium capitalize text-foreground">{key.replace(/_/g, ' ')}: </span>
                      <span className="text-muted-foreground">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

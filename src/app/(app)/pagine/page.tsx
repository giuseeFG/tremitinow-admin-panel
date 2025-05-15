
"use client";
import type { Page } from '@/types';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Loader2, MoreHorizontal } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/graphql/client'; 
import { GET_PAGES_QUERY } from '@/lib/graphql/queries'; 
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-bold text-foreground">Gestione Pagine</CardTitle>
          <CardDescription>Visualizza e gestisci le pagine informative del sito.</CardDescription>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Crea Nuova Pagina (Demo)
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titolo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-medium">{page.title}</TableCell>
                <TableCell>{page.category?.category || '-'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Apri menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/pagine/${page.id}`}>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Vedi Dettagli
                        </Link>
                      </DropdownMenuItem>
                      {/* Altre azioni future qui (es. Modifica, Elimina) */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pages.length === 0 && !loading && (
          <p className="text-center py-4 text-muted-foreground">Nessuna pagina trovata.</p>
        )}
      </CardContent>
    </Card>
  );
}

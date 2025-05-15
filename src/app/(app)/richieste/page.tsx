
"use client";
import type { Request as AppRequest } from '@/types'; // Renamed to avoid conflict with DOM Request
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge'; // Badge not used in this mock
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import React, { useEffect, useState } from 'react';
// import { apiClient } from '@/lib/graphql/client'; // Placeholder for API client
// import { GET_REQUESTS_QUERY } from '@/lib/graphql/queries'; // Placeholder for GraphQL query

// Mock data (replace with API call to 'form_requests' table)
const mockRequests: AppRequest[] = [
  { id: 1, email: 'cittadino1@example.com', name: 'Info Traghetti San Domino', note: 'Richiesta informazioni su orari traghetti per San Domino.', created_at: new Date(2023, 4, 12, 10, 30).toISOString(), category_detail: { category: 'Trasporti' } },
  { id: 2, email: 'turista@example.net', name: 'Guide Turistiche Agosto', note: 'Vorrei sapere se ci sono guide turistiche disponibili per il 15 Agosto.', created_at: new Date(2023, 4, 11, 15, 0).toISOString(), category_detail: { category: 'Turismo' } },
  { id: 3, email: 'fornitore@example.org', name: 'Preventivo Pulizia Spiagge', note: 'Preventivo per pulizia spiagge.', created_at: new Date(2023, 4, 10, 9, 0).toISOString(), category_detail: { category: 'Servizi' } },
];

export default function RichiestePage() {
  const [requests, setRequests] = useState<AppRequest[]>(mockRequests);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const fetchRequests = async () => {
  //     setLoading(true);
  //     try {
  //       // TODO: Replace with actual API call
  //       // const response = await apiClient<{ form_requests: any[] }>(GET_REQUESTS_QUERY);
  //       // if (response.data && response.data.form_requests) {
  //       //   const fetchedRequests: AppRequest[] = response.data.form_requests.map(fr => ({
  //       //     id: fr.id,
  //       //     email: fr.email,
  //       //     name: fr.page_name, // Mapped from form_requests.page_name
  //       //     note: fr.notes,     // Mapped from form_requests.notes
  //       //     created_at: fr.created_at,
  //       //     category_detail: fr.category_detail ? { category: fr.category_detail.category } : null,
  //       //   }));
  //       //   setRequests(fetchedRequests);
  //       // } else if (response.errors) {
  //       //   console.error("GraphQL errors:", response.errors);
  //       //   setRequests(mockRequests); // Fallback
  //       // }
  //       setRequests(mockRequests); // Using mock data for now
  //     } catch (error) {
  //       console.error("Failed to fetch requests:", error);
  //       setRequests(mockRequests); // Fallback
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchRequests();
  // }, []);

  if (loading && requests.length === 0) {
    return <div className="flex justify-center items-center h-64">Caricamento richieste...</div>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">Gestione Richieste</CardTitle>
        <CardDescription>Visualizza le richieste pervenute (dalla tabella Form Requests), ordinate per data decrescente.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data e Ora</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Oggetto/Pagina</TableHead> {/* Changed from Nome to Oggetto/Pagina */}
              <TableHead>Note</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  {new Date(request.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell className="font-medium">{request.email}</TableCell>
                <TableCell>{request.name}</TableCell> {/* This is form_requests.page_name */}
                <TableCell className="text-muted-foreground max-w-xs truncate">{request.note}</TableCell>
                <TableCell className="text-muted-foreground">{request.category_detail?.category || '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" /> Vedi (Demo)
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {requests.length === 0 && !loading && (
          <p className="text-center py-4 text-muted-foreground">Nessuna richiesta trovata.</p>
        )}
      </CardContent>
    </Card>
  );
}

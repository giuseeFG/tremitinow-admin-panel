import type { Request } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

// Mock data (replace with Firestore query)
const mockRequests: Request[] = [
  { id: 'req1', email: 'cittadino1@example.com', name: 'Carlo Esposito', note: 'Richiesta informazioni su orari traghetti per San Domino.', createdAt: new Date(2023, 4, 12, 10, 30).toISOString() },
  { id: 'req2', email: 'turista@example.net', name: 'Anna Muller', note: 'Vorrei sapere se ci sono guide turistiche disponibili per il 15 Agosto.', createdAt: new Date(2023, 4, 11, 15, 0).toISOString() },
  { id: 'req3', email: 'fornitore@example.org', name: 'Ditta Pulizie Srl', note: 'Preventivo per pulizia spiagge.', createdAt: new Date(2023, 4, 10, 9, 0).toISOString() },
];

export default function RichiestePage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">Gestione Richieste</CardTitle>
        <CardDescription>Visualizza le richieste pervenute, ordinate per data decrescente.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data e Ora</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  {new Date(request.createdAt).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell className="font-medium">{request.email}</TableCell>
                <TableCell>{request.name}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">{request.note}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" /> Vedi (Demo)
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

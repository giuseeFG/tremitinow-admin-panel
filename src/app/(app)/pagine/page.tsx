import type { Page } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText } from 'lucide-react';

// Mock data (replace with Firestore query)
const mockPages: Page[] = [
  { id: 'page1', title: 'Storia delle Isole Tremiti', content: 'Contenuto dettagliato sulla storia...', metadata: { author: 'Comune', lastUpdated: '2023-01-01' }, createdAt: new Date(2023,0,1).toISOString() },
  { id: 'page2', title: 'Come Raggiungerci', content: 'Informazioni sui trasporti...', metadata: { version: '1.2' }, createdAt: new Date(2023,0,5).toISOString() },
  { id: 'page3', title: 'Servizi Comunali', content: 'Elenco dei servizi offerti...', metadata: { department: 'Ufficio Anagrafe' }, createdAt: new Date(2023,0,10).toISOString() },
];

export default function PaginePage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pagine Informative</h1>
          <p className="text-muted-foreground">Gestisci le pagine statiche del sito.</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Crea Nuova Pagina (Demo)
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockPages.map((page) => (
          <Card key={page.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl text-primary">{page.title}</CardTitle>
              <CardDescription>Creata il: {new Date(page.createdAt).toLocaleDateString('it-IT')}</CardDescription>
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
    </div>
  );
}

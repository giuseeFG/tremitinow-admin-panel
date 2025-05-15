"use client";

import type { Post } from '@/types';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';

// Mock data (replace with Firestore query)
const mockPosts: Post[] = [
  { id: 'post1', title: 'Benvenuti alle Isole Tremiti', content: 'Un paradiso naturale nel cuore dell\'Adriatico...', author: { id: 'op1', displayName: 'Mario Rossi' }, group: {id: 'g1', title: 'Turismo'}, createdAt: new Date(2023, 4, 10).toISOString() },
  { id: 'post2', title: 'Eventi Estivi 2023', content: 'Scopri il calendario completo degli eventi estivi...', author: { id: 'op2', displayName: 'Laura Bianchi' }, group: {id: 'g2', title: 'Eventi'}, createdAt: new Date(2023, 3, 25).toISOString() },
  { id: 'post3', title: 'Nuove Regole per la Navigazione', content: 'Informazioni importanti per i diportisti...', author: { id: 'op1', displayName: 'Mario Rossi' }, createdAt: new Date(2023, 4, 1).toISOString() },
];

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default function PostsPage() {
  const { toast } = useToast();

  const handleDeletePost = (postId: string, postTitle: string) => {
     toast({
      title: `Eliminazione Post`,
      description: `Il post "${postTitle}" è stato richiesto per l'eliminazione. (Funzionalità demo)`,
      variant: "destructive"
    });
    // Implement actual deletion logic here
    console.log(`Deleting post ${postId}`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">Gestione Post</CardTitle>
        <CardDescription>Visualizza e gestisci i post del blog (ultimi 20). </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titolo</TableHead>
              <TableHead>Estratto</TableHead>
              <TableHead>Autore</TableHead>
              <TableHead>Gruppo</TableHead>
              <TableHead>Creato il</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPosts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell className="text-muted-foreground">{truncateText(post.content, 50)}</TableCell>
                <TableCell>{post.author.displayName}</TableCell>
                <TableCell>
                  {post.group ? <Badge variant="secondary">{post.group.title}</Badge> : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>{new Date(post.createdAt).toLocaleDateString('it-IT')}</TableCell>
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
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeletePost(post.id, post.title)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Elimina Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

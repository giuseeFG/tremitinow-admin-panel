
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
import React, { useEffect, useState } from 'react';
// import { apiClient } from '@/lib/graphql/client'; // Placeholder for API client
// import { GET_POSTS_QUERY } from '@/lib/graphql/queries'; // Placeholder for GraphQL query

// Mock data (replace with API call)
const mockPosts: Post[] = [
  { id: 1, title: 'Benvenuti alle Isole Tremiti', content: 'Un paradiso naturale nel cuore dell\'Adriatico...', author: { id: 101, displayName: 'Mario Rossi', first_name: 'Mario', last_name: 'Rossi' }, group: {id: 201, title: 'Turismo'}, created_at: new Date(2023, 4, 10).toISOString() },
  { id: 2, title: 'Eventi Estivi 2023', content: 'Scopri il calendario completo degli eventi estivi...', author: { id: 102, displayName: 'Laura Bianchi', first_name: 'Laura', last_name: 'Bianchi' }, group: {id: 202, title: 'Eventi'}, created_at: new Date(2023, 3, 25).toISOString() },
  { id: 3, title: 'Nuove Regole per la Navigazione', content: 'Informazioni importanti per i diportisti...', author: { id: 101, displayName: 'Mario Rossi', first_name: 'Mario', last_name: 'Rossi' }, created_at: new Date(2023, 4, 1).toISOString() },
];


const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default function PostsPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const fetchPosts = async () => {
  //     setLoading(true);
  //     try {
  //       // TODO: Replace with actual API call
  //       // const response = await apiClient<{ posts: any[] }>(GET_POSTS_QUERY); // Using 'any[]' for raw Hasura response
  //       // if (response.data && response.data.posts) {
  //       //   const fetchedPosts: Post[] = response.data.posts.map(p => ({
  //       //     id: p.id,
  //       //     title: p.title,
  //       //     content: p.content,
  //       //     created_at: p.created_at,
  //       //     author: {
  //       //       id: p.author.id,
  //       //       first_name: p.author.first_name,
  //       //       last_name: p.author.last_name,
  //       //       displayName: `${p.author.first_name || ''} ${p.author.last_name || ''}`.trim(),
  //       //       avatar: p.author.avatar,
  //       //     },
  //       //     group: p.group ? {
  //       //       id: p.group.id,
  //       //       title: p.group.title,
  //       //       avatar: p.group.avatar,
  //       //     } : null,
  //       //     media: p.media,
  //       //     tags: p.tags,
  //       //   }));
  //       //   setPosts(fetchedPosts);
  //       // } else if (response.errors) {
  //       //   console.error("GraphQL errors:", response.errors);
  //       //   toast({ title: "Errore", description: "Impossibile caricare i post.", variant: "destructive" });
  //       //   setPosts(mockPosts); // Fallback
  //       // }
  //       setPosts(mockPosts); // Using mock data for now
  //     } catch (error) {
  //       console.error("Failed to fetch posts:", error);
  //       toast({ title: "Errore", description: "Impossibile caricare i post.", variant: "destructive" });
  //       setPosts(mockPosts); // Fallback
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchPosts();
  // }, [toast]);

  const handleDeletePost = (postId: number, postTitle: string) => {
     toast({
      title: `Eliminazione Post`,
      description: `Il post "${postTitle}" è stato richiesto per l'eliminazione. (Funzionalità demo)`,
      variant: "destructive"
    });
    // Implement actual deletion logic here
    console.log(`Deleting post ${postId}`);
  };
  
  if (loading && posts.length === 0) {
    return <div className="flex justify-center items-center h-64">Caricamento post...</div>;
  }

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
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell className="text-muted-foreground">{truncateText(post.content, 50)}</TableCell>
                <TableCell>{post.author.displayName || `${post.author.first_name} ${post.author.last_name}`}</TableCell>
                <TableCell>
                  {post.group ? <Badge variant="secondary">{post.group.title}</Badge> : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>{new Date(post.created_at).toLocaleDateString('it-IT')}</TableCell>
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
        {posts.length === 0 && !loading && (
          <p className="text-center py-4 text-muted-foreground">Nessun post trovato.</p>
        )}
      </CardContent>
    </Card>
  );
}


"use client";

import type { Page } from '@/types';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { getPageByID, updatePage, deleteGroupCategory, insertGroupCategory } from '@/lib/pages';
import CategoriesSelector from '@/components/shared/CategoriesSelector'; // Updated import
import { parseImg } from "@/lib/utils";
import { Editor } from '@tinymce/tinymce-react'; // Assuming you have this dependency

export default function PageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const editorRef = useRef<any>(null); // For TinyMCE editor instance

  const pageId = params?.id ? parseInt(params.id as string, 10) : null;

  const [page, setPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState<Partial<Page>>({}); // Use Partial for formData
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchPage() {
      if (!pageId) {
        setLoading(false);
        toast({ title: "ID Pagina non valido", variant: "destructive" });
        return;
      }
      setLoading(true);
      const data = await getPageByID(pageId);
      if (data) {
        setPage(data);
        setFormData({
          title: data.title,
          description: data.description,
          active: data.active,
          can_send_notification: data.can_send_notification,
          can_publish_on_fb: data.can_publish_on_fb,
          additional_btn_text: data.additional_btn_text,
          additional_url: data.additional_url,
          btn_info_text: data.btn_info_text,
          facebook: data.facebook,
          instagram: data.instagram,
          email: data.email,
          phone: data.phone,
          avatar: data.avatar,
          cover: data.cover,
        });
        setSelectedCategories(data.group_categories_2?.map(item => item.category?.id).filter(id => id !== undefined) as number[] || []);
      } else {
        toast({ title: "Pagina non trovata", variant: "destructive" });
      }
      setLoading(false);
    }

    if (pageId) {
      fetchPage();
    }
  }, [pageId, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }));
  };

  const handleSave = async () => {
    if (!page || !page.id) {
      toast({ title: "Errore: ID Pagina mancante", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const dataToUpdate: Partial<Page> = { ...formData };
      // Ensure boolean values are correctly sent
      dataToUpdate.active = formData.active === undefined ? page.active : formData.active;
      dataToUpdate.can_send_notification = formData.can_send_notification === undefined ? page.can_send_notification : formData.can_send_notification;
      dataToUpdate.can_publish_on_fb = formData.can_publish_on_fb === undefined ? page.can_publish_on_fb : formData.can_publish_on_fb;


      const success = await updatePage(page.id, dataToUpdate);
      if (!success) throw new Error("Salvataggio dati principali fallito");

      await deleteGroupCategory(page.id);
      for (const categoryId of selectedCategories) {
        await insertGroupCategory(page.id, categoryId);
      }

      toast({ title: "Pagina aggiornata con successo", description: "Le modifiche sono state salvate." });
      // Optionally refetch page data to ensure UI is in sync, or update local state 'page'
      const updatedPageData = await getPageByID(pageId as number);
      if (updatedPageData) setPage(updatedPageData);

    } catch (error) {
      console.error('Errore nell\'aggiornamento', error);
      toast({ title: "Errore durante l'aggiornamento", description: error instanceof Error ? error.message : "Si è verificato un errore imprevisto.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleImageUpload = (type: 'avatar' | 'cover') => async (info: { url: string } | null) => {
    if (!page || !page.id || !info) return;
    
    const newImageUrl = info.url;
    const updatedData = { ...formData, [type]: newImageUrl };
    setFormData(updatedData); // Optimistic UI update for form data
    
    // Update the main page state as well for image previews
    setPage(prevPage => prevPage ? { ...prevPage, [type]: newImageUrl } : null);

    // Persist this specific change immediately (optional, or batch with main save)
    // For simplicity, we'll rely on the main "Salva" button for now
    // await updatePage(page.id, { [type]: newImageUrl }); 
    // toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} aggiornato`, description: "Ricorda di salvare tutte le modifiche." });
  };


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-2">Caricamento pagina...</span>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-semibold text-destructive">Pagina non trovata</h1>
        <Button variant="link" asChild className="mt-4">
          <Link href="/pagine">Torna all'elenco pagine</Link>
        </Button>
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
            {/* Placeholder for delete button if needed */}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">{formData?.title || page.title}</CardTitle>
          <CardDescription>Modifica i dettagli della pagina qui sotto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2">
              <Label htmlFor="title">Titolo</Label>
              <Input
                id="title"
                name="title"
                value={formData?.title || ''}
                onChange={handleChange}
                className="text-base"
              />
            </div>
            <div className="md:col-span-1 space-y-2">
              <Label htmlFor="active">Stato pagina</Label>
              <Select
                name="active"
                value={formData?.active === undefined ? (page.active ? 'true' : 'false') : (formData.active ? 'true' : 'false')}
                onValueChange={(value) => setFormData(prev => ({ ...prev, active: value === 'true' }))}
              >
                <SelectTrigger id="active" className="text-base">
                  <SelectValue placeholder="Seleziona stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Attiva</SelectItem>
                  <SelectItem value="false">Disattivata</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Opzioni</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="can_send_notification"
                name="can_send_notification"
                checked={formData?.can_send_notification || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_send_notification: !!checked }))}
              />
              <Label htmlFor="can_send_notification" className="font-normal">Può inviare notifiche</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="can_publish_on_fb"
                name="can_publish_on_fb"
                checked={formData?.can_publish_on_fb || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_publish_on_fb: !!checked }))}
              />
              <Label htmlFor="can_publish_on_fb" className="font-normal">Può condividere automaticamente su FB/IG</Label>
            </div>
          </div>

          <CategoriesSelector
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <Label htmlFor="additional_btn_text">Testo bottone aggiuntivo</Label>
              <Input id="additional_btn_text" name="additional_btn_text" value={formData?.additional_btn_text || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="additional_url">URL aggiuntivo</Label>
              <Input id="additional_url" name="additional_url" type="url" value={formData?.additional_url || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="btn_info_text">Testo info bottone</Label>
              <Input id="btn_info_text" name="btn_info_text" value={formData?.btn_info_text || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="facebook">Facebook URL</Label>
              <Input id="facebook" name="facebook" type="url" value={formData?.facebook || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram URL</Label>
              <Input id="instagram" name="instagram" type="url" value={formData?.instagram || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="email">Email di contatto</Label>
              <Input id="email" name="email" type="email" value={formData?.email || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" name="phone" type="tel" value={formData?.phone || ''} onChange={handleChange} />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="mb-2 block">Descrizione</Label>
            <Editor
              apiKey={process.env.NEXT_PUBLIC_TINY_MCE || 'no-api-key'}
              onInit={(evt, editor) => editorRef.current = editor}
              value={formData?.description || ''}
              init={{
                height: 350,
                menubar: false,
                plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount',
                toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
              }}
              onEditorChange={handleEditorChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-2">
                <Label>Avatar (URL Immagine)</Label>
                <Input 
                    name="avatar" 
                    value={formData?.avatar || ''} 
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.png"
                />
                {formData?.avatar && (
                    <div className="mt-2 border rounded-md p-2 flex justify-center bg-muted/30">
                        <img 
                            src={parseImg(formData.avatar) || undefined} 
                            alt="Avatar Preview" 
                            className="max-h-40 rounded"
                            data-ai-hint="logo company"
                        />
                    </div>
                )}
                 {/* Placeholder for InputImageUploader component 
                <div className="p-4 border-dashed border-2 border-border rounded-md text-center text-muted-foreground">
                    InputImageUploader per Avatar (da implementare)
                </div>
                */}
            </div>
            <div className="space-y-2">
                <Label>Cover (URL Immagine)</Label>
                 <Input 
                    name="cover" 
                    value={formData?.cover || ''} 
                    onChange={handleChange}
                    placeholder="https://example.com/cover.png"
                />
                {formData?.cover && (
                     <div className="mt-2 border rounded-md p-2 flex justify-center bg-muted/30">
                        <img 
                            src={parseImg(formData.cover) || undefined} 
                            alt="Cover Preview" 
                            className="max-h-40 rounded"
                            data-ai-hint="background landscape"
                        />
                    </div>
                )}
                {/* Placeholder for InputImageUploader component
                <div className="p-4 border-dashed border-2 border-border rounded-md text-center text-muted-foreground">
                    InputImageUploader per Cover (da implementare)
                </div>
                */}
            </div>
          </div>


          <div className="flex justify-end gap-3 mt-8 border-t border-border pt-6">
            <Button variant="outline" onClick={() => router.back()} disabled={isSaving}>
              Indietro
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

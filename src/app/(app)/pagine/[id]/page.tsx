
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
import CategoriesSelector from '@/components/shared/CategoriesSelector';
import { parseImg } from "@/lib/utils";
import { Editor } from '@tinymce/tinymce-react';
import InputImageUploader from '@/components/shared/InputImageUploader'; // Import the uploader

export default function PageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const editorRef = useRef<any>(null); 

  const pageId = params?.id ? parseInt(params.id as string, 10) : null;

  const [page, setPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState<Partial<Page>>({});
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
          // Add other fields from GET_PAGE_BY_ID_QUERY if needed in form
          address: data.address,
          lat: data.lat,
          lng: data.lng,
          web: data.web,
          private: data.private,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      const updatedPageData = await getPageByID(pageId as number);
      if (updatedPageData) {
        setPage(updatedPageData);
         // Re-sync formData with the latest from DB after successful save, especially for images
        setFormData(prevFormData => ({
            ...prevFormData,
            title: updatedPageData.title,
            description: updatedPageData.description,
            active: updatedPageData.active,
            can_send_notification: updatedPageData.can_send_notification,
            can_publish_on_fb: updatedPageData.can_publish_on_fb,
            additional_btn_text: updatedPageData.additional_btn_text,
            additional_url: updatedPageData.additional_url,
            btn_info_text: updatedPageData.btn_info_text,
            facebook: updatedPageData.facebook,
            instagram: updatedPageData.instagram,
            email: updatedPageData.email,
            phone: updatedPageData.phone,
            avatar: updatedPageData.avatar, // Ensure this is updated
            cover: updatedPageData.cover,   // Ensure this is updated
            address: updatedPageData.address,
            lat: updatedPageData.lat,
            lng: updatedPageData.lng,
            web: updatedPageData.web,
            private: updatedPageData.private,
        }));
      }

    } catch (error) {
      console.error('Errore nell\'aggiornamento', error);
      toast({ title: "Errore durante l'aggiornamento", description: error instanceof Error ? error.message : "Si è verificato un errore imprevisto.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleImageUpload = (type: 'avatar' | 'cover') => (info: { url: string } | null) => {
    if (!page || !page.id || !info) return;
    
    const newImageUrl = info.url;
    // Optimistically update formData for immediate reflection in inputs/previews tied to formData
    setFormData(prevFormData => ({ ...prevFormData, [type]: newImageUrl }));
    // Also update the main `page` state if other parts of the UI depend on it directly for previews
    setPage(prevPage => prevPage ? { ...prevPage, [type]: newImageUrl } : null);
    
    // Persist this specific change immediately to the backend
    updatePage(page.id, { [type]: newImageUrl })
      .then(success => {
        if (success) {
          toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} aggiornato`, description: "Immagine salvata nel database." });
        } else {
          toast({ title: `Errore aggiornamento ${type}`, description: "Impossibile salvare l'immagine nel database.", variant: "destructive" });
          // Revert optimistic update if save fails
          setFormData(prevFormData => ({ ...prevFormData, [type]: page[type] })); // page[type] has original value
          setPage(prevPage => prevPage ? { ...prevPage, [type]: page[type] } : null);

        }
      })
      .catch(error => {
        console.error(`Error updating ${type} image immediately:`, error);
        toast({ title: `Errore aggiornamento ${type}`, description: "Si è verificato un errore di rete.", variant: "destructive" });
         setFormData(prevFormData => ({ ...prevFormData, [type]: page[type] }));
         setPage(prevPage => prevPage ? { ...prevPage, [type]: page[type] } : null);
      });
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
             <div className="md:col-span-1 space-y-2">
              <Label htmlFor="private">Visibilità pagina</Label>
              <Select
                name="private"
                value={formData?.private === undefined ? (page.private ? 'true' : 'false') : (formData.private ? 'true' : 'false')}
                onValueChange={(value) => setFormData(prev => ({ ...prev, private: value === 'true' }))}
              >
                <SelectTrigger id="private" className="text-base">
                  <SelectValue placeholder="Seleziona visibilità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Pubblica</SelectItem>
                  <SelectItem value="true">Privata (nascosta)</SelectItem>
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
              <Label htmlFor="address">Indirizzo</Label>
              <Input id="address" name="address" value={formData?.address || ''} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="web">Sito Web</Label>
              <Input id="web" name="web" type="url" value={formData?.web || ''} onChange={handleChange} />
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
             <div>
              <Label htmlFor="lat">Latitudine</Label>
              <Input id="lat" name="lat" value={formData?.lat || ''} onChange={handleChange} />
            </div>
             <div>
              <Label htmlFor="lng">Longitudine</Label>
              <Input id="lng" name="lng" value={formData?.lng || ''} onChange={handleChange} />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="mb-2 block">Descrizione</Label>
            <Editor
              apiKey={process.env.NEXT_PUBLIC_TINY_MCE || 'yuqyap8k0wir6fcb44tkrnm2xwp8z72nrifaw7t6cime7f2h'}
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
                <Label>Avatar</Label>
                <InputImageUploader
                    field={{ value: formData?.avatar }}
                    name="avatarFile" // Unique name for the uploader instance
                    preview={formData?.avatar && (
                        <div className="border rounded-md p-2 flex justify-center items-center bg-muted/30 min-h-[10rem]">
                            <img 
                                src={parseImg(formData.avatar) || `https://placehold.co/150x150.png?text=Avatar`} 
                                alt="Anteprima Avatar" 
                                className="max-h-40 rounded object-contain"
                                data-ai-hint="logo company"
                            />
                        </div>
                    )}
                    onSuccess={handleImageUpload('avatar')}
                    title="Carica Avatar"
                />
            </div>
            <div className="space-y-2">
                <Label>Cover</Label>
                <InputImageUploader
                    field={{ value: formData?.cover }}
                    name="coverFile" // Unique name for the uploader instance
                    preview={formData?.cover && (
                         <div className="border rounded-md p-2 flex justify-center items-center bg-muted/30 min-h-[10rem]">
                            <img 
                                src={parseImg(formData.cover) || `https://placehold.co/300x150.png?text=Cover`}
                                alt="Anteprima Cover" 
                                className="max-h-40 rounded object-contain"
                                data-ai-hint="background landscape"
                            />
                        </div>
                    )}
                    onSuccess={handleImageUpload('cover')}
                    title="Carica Cover"
                />
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

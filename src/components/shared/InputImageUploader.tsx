
"use client";

import { Button, Upload, UploadProps } from 'antd'; // Assuming Antd will be installed
import { Edit, UploadIcon } from "lucide-react";
import { ReactNode, useState } from "react";
import {
    uploadBytesResumable,
    ref,
    getDownloadURL,
    getStorage // Import getStorage
} from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
// Using ShadCN Dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { PinturaEditor } from '@pqina/react-pintura';
import { getEditorDefaults } from '@pqina/pintura';
import '@pqina/pintura/pintura.css';
import { storage } from '@/lib/firebase/config'; // Import initialized storage

const { Dragger } = Upload;

export const firebaseUploadRequest = async (file: any, onSuccess: (result: { url: string, file: any }) => void, onError: (error: Error) => void) => {
    const extension = file.name.split('.').pop();
    const newName = uuidv4() + '.' + extension;
    const storageRef = ref(storage, newName); // Use the initialized storage instance
    const uploadTask = uploadBytesResumable(storageRef, file as Blob);

    uploadTask.on(
        "state_changed",
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload progress:', progress);
        },
        (error) => {
            console.error("Upload error:", error);
            onError(error);
        },
        async () => {
            try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                if (onSuccess) onSuccess({ url: downloadURL, file });
            } catch (error) {
                console.error("Error getting download URL:", error);
                onError(error as Error);
            }
        }
    );
};

interface FileSelectorProps {
    field?: { value?: string | null }; // field.value should be the current image URL
    form?: any; // Not used in the provided logic if onSuccess is present
    title?: ReactNode;
    name: string; // Name for the Dragger and for context
    preview?: ReactNode;
    onSuccess?: (info: { url: string, file: any }) => void;
}

export const DragArea = ({ title }: { title: ReactNode }) => {
    return (
        <div className="flex flex-col justify-center items-center p-4 border-2 border-dashed border-border rounded-md hover:border-primary transition-colors h-32">
            <UploadIcon className="w-10 h-10 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{title ?? "Trascina qui il file o clicca per selezionare"}</p>
        </div>
    )
}

export default function InputImageUploader(props: FileSelectorProps) {
    const {
        field, // Expects { value: 'current_image_url' }
        preview,
        title,
        onSuccess,
        name // Used for Antd Dragger name
    } = props;

    const [openEditor, setOpenEditor] = useState(false);
    const [editorSrc, setEditorSrc] = useState<any>(undefined);

    const currentImageUrl = field?.value;

    const uploadProps: UploadProps = {
        name: name, // Name for the file input in Antd Dragger
        multiple: false,
        maxCount: 1,
        showUploadList: false,
        beforeUpload: (file) => {
            setEditorSrc(file);
            setOpenEditor(true);
            return false; // Prevent antd default upload
        },
        // fileList: [], // Not needed with showUploadList: false
    };

    return (
        <>
            <Dialog open={openEditor} onOpenChange={setOpenEditor}>
                <DialogContent className="sm:max-w-[600px] p-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Editor Immagine</DialogTitle>
                         <DialogClose />
                    </DialogHeader>
                    <div className="h-[500px] w-full">
                        <PinturaEditor
                            {...getEditorDefaults()}
                            src={editorSrc ?? currentImageUrl} // Use currentImageUrl if no new file is selected
                            onProcess={async (res) => {
                                try {
                                    await firebaseUploadRequest(res.dest, 
                                        ({ url, file }) => {
                                            if (onSuccess) {
                                                onSuccess({ url, file });
                                            }
                                            setEditorSrc(undefined);
                                            setOpenEditor(false);
                                        },
                                        (error) => { // Error callback for firebaseUploadRequest
                                            console.error("Upload failed in Pintura onProcess:", error);
                                            // Optionally show a toast or error message to the user
                                            setEditorSrc(undefined); // Clear editor src
                                            setOpenEditor(false);    // Close editor
                                        }
                                    );
                                } catch (error) {
                                    console.error("Error processing image with Pintura and uploading:", error);
                                    setEditorSrc(undefined);
                                    setOpenEditor(false);
                                }
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dragger {...uploadProps} className="bg-card p-0 border-none hover:bg-card">
                <div className="relative group">
                    {preview ? (
                        <div className="relative">
                            {preview}
                            {currentImageUrl && (
                                <Button
                                    type="primary" // Antd button type
                                    icon={<Edit size={16}/>}
                                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity !flex !items-center !justify-center !p-2 !h-auto"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditorSrc(currentImageUrl); // Open editor with current image
                                        setOpenEditor(true);
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        <DragArea title={title} />
                    )}
                </div>
            </Dragger>
        </>
    );
}

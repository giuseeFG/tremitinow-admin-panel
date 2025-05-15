
'use client';

import {useState, useRef} from 'react';
import {PinturaEditor} from '@pqina/react-pintura';
import {Button} from '@/components/ui/button';
import {createDefaultImageReader} from '@pqina/pintura';
// Ensure you have Pintura CSS available and imported, e.g., by ensuring
// '@pqina/pintura/pintura.css' is imported globally or as needed.
// The `pintura` variable below likely refers to a CSS module import if you set it up that way.
// For simplicity, I am assuming a global CSS import for Pintura,
// or you might need to adjust the className usage if `pintura` is a module.
// import pintura from "@pqina/pintura/pintura.module.css"; // If using CSS modules

interface PinturaUploaderProps {
    onImageProcessed: (processedImage: File | Blob) => void;
    initialImageUrl?: string | null;
}

export default function PinturaUploader({onImageProcessed, initialImageUrl}: PinturaUploaderProps) {
    const [showEditor, setShowEditor] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | File | Blob | null>(initialImageUrl || null);
    const editorRef = useRef(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setImageSrc(file);
            setShowEditor(true);
        }
    };

    return (
        <div className="mt-6 space-y-4">
            {!showEditor && (
                 <label htmlFor="pintura-file-input" className="cursor-pointer">
                    <Button asChild>
                        <span>Carica Immagine</span>
                    </Button>
                    <input 
                        type="file" 
                        id="pintura-file-input" 
                        accept="image/*" 
                        onChange={handleFileSelect}
                        className="sr-only" // Hide the default file input
                    />
                </label>
            )}

            {showEditor && imageSrc && (
                <div className="mt-6">
                    <PinturaEditor
                        ref={editorRef}
                        src={imageSrc}
                        imageReader={createDefaultImageReader()}
                        // className={pintura} // Adjust if using CSS modules
                        onLoad={({imageState}: any) => {
                            // The image is loaded, you might want to update imageSrc
                            // if imageState.dest is different and represents a processed preview
                            // For now, we rely on onProcess to get the final image.
                        }}
                        onProcess={({dest}: any) => { // dest is usually a Blob
                            setImageSrc(dest); // Update preview if needed
                            onImageProcessed(dest);
                            setShowEditor(false);
                        }}
                        onHide={() => setShowEditor(false) } // Close editor if user cancels
                        onModalClose={() => setShowEditor(false)} // Modal close event
                    />
                     <Button variant="outline" onClick={() => setShowEditor(false)} className="mt-2">
                        Annulla
                    </Button>
                </div>
            )}
        </div>
    );
}

'use client';

import Image from "next/image";
import { useState, useCallback, useRef, useMemo, memo } from "react";
import { removeBackground } from "@imgly/background-removal";
import { motion, AnimatePresence } from "framer-motion";
import { FiUpload, FiSliders, FiDownload, FiX } from "react-icons/fi";

type ImagePair = {
  id: string;
  original: File;
  processed: string | null;
};

// Memoized ImagePairComponent
const ImagePairComponent = memo(({ pair, onRemove }: { pair: ImagePair; onRemove: (id: string) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-100 p-4 rounded-xl relative"
    >
      <button
        onClick={() => onRemove(pair.id)}
        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 z-10"
      >
        <FiX size={20} />
      </button>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-indigo-900">Original</h3>
          <div className="relative w-full pt-[100%]">
            <Image
              src={URL.createObjectURL(pair.original)}
              alt="Original"
              fill
              className="absolute inset-0 object-contain rounded-lg"
            />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-indigo-900">Processed</h3>
          {pair.processed ? (
            <>
              <div className="relative w-full pt-[100%]">
                <Image
                  src={pair.processed}
                  alt="Processed"
                  fill
                  className="absolute inset-0 object-contain rounded-lg"
                />
              </div>
              <a
                href={pair.processed}
                download={`processed_${pair.original.name}`}
                className="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <FiDownload className="mr-1" />
                Download
              </a>
              
              {/* --- MONETIZATION: PRINTFUL LINK (Per Image) --- */}
              <div className="mt-2 text-sm">
                 <a href="https://www.printful.com/" target="_blank" className="text-purple-600 hover:underline font-bold">
                    🖨️ Print this on a T-Shirt
                 </a>
              </div>
            </>
          ) : (
            <div className="w-full pt-[100%] relative bg-gray-200 rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Not processed yet
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ImagePairComponent.displayName = 'ImagePairComponent';

// Updated UploadArea component
const UploadArea = memo(({ isDragging, onDragEnter, onDragLeave, onDragOver, onDrop, fileInputRef, onFileChange }: {
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div 
      className={`relative border-2 border-dashed ${isDragging ? 'border-indigo-500 bg-indigo-100' : 'border-indigo-300'} rounded-xl p-8 transition-colors duration-200`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        id="imageUpload"
        multiple
        ref={fileInputRef}
      />
      <label htmlFor="imageUpload" className="flex flex-col items-center cursor-pointer z-10 relative">
        <FiUpload className="text-4xl text-indigo-500 mb-4" />
        <span className="text-indigo-900 text-center">
          Drag & Drop or Click to Upload Multiple Images
        </span>
      </label>
      {isDragging && (
        <div className="absolute inset-0 bg-indigo-100 bg-opacity-90 flex items-center justify-center">
          <span className="text-indigo-900 font-semibold">Drop images here</span>
        </div>
      )}
    </div>
  );
});

UploadArea.displayName = 'UploadArea';

export default function Home() {
  const [imagePairs, setImagePairs] = useState<ImagePair[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState<number>(85);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((files: FileList | null) => {
    if (files) {
      if (imagePairs.length > 0) {
        const confirmClear = window.confirm("Uploading new images will clear all existing images. Do you want to continue?");
        if (!confirmClear) {
          return;
        }
      }

      const newPairs = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        original: file,
        processed: null
      }));
      setImagePairs(newPairs);
    }
  }, [imagePairs.length]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  }, [handleImageUpload]);

  const handleRemoveBackground = useCallback(async () => {
    if (imagePairs.length === 0) return;

    setIsProcessing(true);
    try {
      const updatedPairs = await Promise.all(
        imagePairs.map(async (pair) => {
          if (pair.processed) return pair;
          const blob = await removeBackground(pair.original, {
            output: { 
              quality: quality / 100,
            },
          });
          const url = URL.createObjectURL(blob);
          return { ...pair, processed: url };
        })
      );
      setImagePairs(updatedPairs);
    } catch (error) {
      console.error("Error removing background:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [imagePairs, quality]);

  const handleRemoveImage = useCallback((id: string) => {
    setImagePairs(prev => prev.filter(pair => pair.id !== id));
  }, []);

  const handleQualityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuality(Number(e.target.value));
  }, []);

  // Memoize the image pairs rendering
  const renderedImagePairs = useMemo(() => (
    <AnimatePresence>
      {imagePairs.map((pair) => (
        <ImagePairComponent key={pair.id} pair={pair} onRemove={handleRemoveImage} />
      ))}
    </AnimatePresence>
  ), [imagePairs, handleRemoveImage]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e.target.files);
  }, [handleImageUpload]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold mb-4 text-center text-indigo-900">
          Background Removal Tool
        </h1>

        {/* ========================================= */}
        {/* 💰 AD SLOT 1: TOP BANNER (Adsterra)       */}
        {/* ========================================= */}
        <div className="w-full flex justify-center mb-8">
            <iframe 
            src="/ad-banner.html" 
            width="728" 
            height="90" 
            frameBorder="0" 
            scrolling="no" 
            style={{border: 'none', maxWidth: '100%', overflow: 'hidden'}}
            title="Advertisement"
            ></iframe>
        </div>
        {/* ========================================= */}
        
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 lg:col-span-1"
            >
              <h2 className="text-2xl font-semibold mb-4 text-indigo-900">Upload Images</h2>
              <UploadArea
                isDragging={isDragging}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
              />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-indigo-900">Quality</label>
                  <span className="text-sm font-semibold text-indigo-600">{quality}%</span>
                </div>
                <div className="flex items-center">
                  <FiSliders className="text-indigo-500 mr-2" />
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={handleQualityChange}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <button
                onClick={handleRemoveBackground}
                disabled={imagePairs.length === 0 || isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span>Remove Background</span>
                )}
              </button>
              
              {/* Add note about first processing time */}
              <p className="text-sm text-gray-600 mt-2 text-center">
                Note: The first processing may take a bit longer as the model loads.
              </p>

               {/* --- MONETIZATION: TIP JAR --- */}
               <div className="mt-6 text-center">
                    <a href="https://www.buymeacoffee.com/" target="_blank" className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-medium hover:bg-yellow-200 transition-colors">
                        ☕ Buy me a coffee
                    </a>
               </div>
            </motion.div>

            <div className="lg:col-span-2 space-y-6">
              {renderedImagePairs}
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* 💰 AD SLOT 2: BOTTOM BANNER (Adsterra)    */}
        {/* ========================================= */}
        <div className="w-full flex justify-center mt-12">
            <iframe 
            src="/ad-banner.html" 
            width="728" 
            height="90" 
            frameBorder="0" 
            scrolling="no" 
            style={{border: 'none', maxWidth: '100%', overflow: 'hidden'}}
            title="Advertisement"
            ></iframe>
        </div>
        {/* ========================================= */}

      </div>
    </div>
  );
}

// client/src/components/transactions/ReceiptUploader.tsx

// Accessible receipt image drag-and-drop uploader with scanning animation and OCR auto-fill callbacks.

'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileImage, Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import type { ReceiptOcrResult } from '@/types';

interface ReceiptUploaderProps {
  onScanComplete: (result: ReceiptOcrResult) => void;
  className?: string;
}

export function ReceiptUploader({ onScanComplete, className = '' }: ReceiptUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<ReceiptOcrResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    setSuccessResult(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only JPEG, PNG, and WebP images are supported');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Receipt image exceeds 5MB limit');
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const result = await api.postForm<ReceiptOcrResult>('/ocr/receipt', formData);
      setSuccessResult(result);
      onScanComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Receipt scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccessResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            isDragging
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-border-subtle hover:border-brand-500/50 bg-surface-muted/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                validateAndSetFile(e.target.files[0]);
              }
            }}
          />
          <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-fg">Click to upload or drag & drop receipt</p>
          <p className="text-xs text-fg-muted mt-1">JPEG, PNG, or WebP (max 5MB)</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4 border border-border-subtle rounded-xl bg-surface-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileImage className="w-8 h-8 text-brand-500 shrink-0" />
              <div className="truncate">
                <p className="text-sm font-medium text-fg truncate">{file.name}</p>
                <p className="text-xs text-fg-muted">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={isScanning}
              className="btn-icon text-fg-muted hover:text-fg"
              aria-label="Remove uploaded receipt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {previewUrl && (
            <div className="relative w-full h-36 rounded-lg overflow-hidden bg-black/5 dark:bg-black/20 border border-border-subtle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full h-full object-contain"
              />
              {isScanning && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                  <Spinner size="md" />
                  <span className="text-xs font-semibold animate-pulse">
                    Scanning Receipt with AI...
                  </span>
                </div>
              )}
            </div>
          )}

          {!successResult && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleScan}
              disabled={isScanning}
              className="w-full flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isScanning ? 'Extracting Fields...' : 'Auto-Fill Fields with AI'}
            </Button>
          )}

          {successResult && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Auto-filled: {successResult.vendor} • {successResult.currency}{' '}
                {successResult.totalAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

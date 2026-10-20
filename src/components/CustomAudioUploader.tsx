import React, { useState } from 'react';
import { saveCustomAudio } from '../lib/audioStorage';
import { Upload, CheckCircle2, Music } from 'lucide-react';

interface CustomAudioUploaderProps {
  onAudioSaved?: (audioId: string) => void;
}

export default function CustomAudioUploader({ onAudioSaved }: CustomAudioUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const audioId = `custom-alarm-${Date.now()}`;
      
      // Save raw audio blob to IndexedDB
      await saveCustomAudio(audioId, file);
      
      setFileName(file.name);
      setUploading(false);
      
      if (onAudioSaved) {
        onAudioSaved(audioId);
      }
    } catch (err) {
      console.error('Failed to save custom audio:', err);
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 border border-dashed border-gray-600 rounded-xl bg-gray-900/50 backdrop-blur-sm">
      <div className="flex items-center space-x-2 text-gray-300 mb-2">
        <Music className="w-5 h-5 text-indigo-400" />
        <span className="font-medium text-sm">Upload Custom Alarm Sound</span>
      </div>

      <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm font-semibold shadow-md">
        <Upload className="w-4 h-4 mr-2" />
        {uploading ? 'Saving...' : 'Choose Audio File'}
        <input 
          type="file" 
          accept="audio/*" 
          className="hidden" 
          onChange={handleFileChange} 
        />
      </label>

      {fileName && (
        <div className="flex items-center space-x-1.5 mt-3 text-green-400 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>Loaded: {fileName}</span>
        </div>
      )}
    </div>
  );
} 
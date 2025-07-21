'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table as TableExtension } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Heading from '@tiptap/extension-heading';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import styles from './reports.module.css';

// UI Components
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Image as ImageIcon, 
  Table as TableIcon,
  Save,
  FileDown,
  AlertCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  MoveLeft,
  MoveRight,
  AlignCenter as ImageCenter,
  Maximize2,
  Minimize2,
  Trash2,
  Move
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Types
interface Study {
  study_id: number;
  patient_id: string;
  patient?: {
    name: string;
    date_of_birth?: string;
    gender?: string;
  };
  date: string;
  time: string;
  modality?: string;
  description?: string;
  body_part?: string;
  reason?: string;
  radiologist_id?: string;
  radiologist?: {
    name: string;
  };
  report_id?: number;
}

interface Report {
  report_id?: number;
  status: string;
  report_file_url?: string;
  content?: string;
  radiologist_id?: string;
  created_at?: string;
  updated_at?: string;
  finalized_at?: string;
}

// Add this CSS class helper function
const getActiveButtonClass = (isActive: boolean | undefined) => {
  return isActive === true
    ? 'bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-200' 
    : 'hover:bg-slate-100';
};

export default function ReportEditorPage() {
  const searchParams = useSearchParams();
  const studyId = searchParams.get('studyId');
  
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [reportStatus, setReportStatus] = useState<string>('draft');
  const [reportData, setReportData] = useState<Report | null>(null);
  const [studyData, setStudyData] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add state for editor update tracking
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableColumns, setTableColumns] = useState(3);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState(100); // percentage of original size

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Fetch study and report data
  useEffect(() => {
    if (!studyId) return;
    
    const fetchData = async () => {
      try {
        // Fetch study data
        const studyResponse = await axios.get(`${backendURL}/studies/${studyId}`);
        setStudyData(studyResponse.data);
        
        // If study has a report, fetch it
        if (studyResponse.data.report_id) {
          const reportResponse = await axios.get(`${backendURL}/reports/${studyResponse.data.report_id}`);
          setReportData(reportResponse.data);
          setReportStatus(reportResponse.data.status);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load study data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studyId]);
  
  // Generate initial template for report
  const generateReportTemplate = () => {
    if (!studyData) return '';
    
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `
      <h1>RADIOLOGY REPORT</h1>

      <h2>Patient Information</h2>
      <p><strong>Name:</strong> ${studyData.patient?.name || 'N/A'}</p>
      <p><strong>DOB:</strong> ${studyData.patient?.date_of_birth ? new Date(studyData.patient.date_of_birth).toLocaleDateString() : 'N/A'}</p>
      <p><strong>ID:</strong> ${studyData.patient_id}</p>
      <p><strong>Gender:</strong> ${studyData.patient?.gender || 'N/A'}</p>

      <h2>Study Information</h2>
      <p><strong>Study ID:</strong> ${studyData.study_id}</p>
      <p><strong>Date:</strong> ${new Date(studyData.date).toLocaleDateString()}</p>
      <p><strong>Modality:</strong> ${studyData.modality || 'N/A'}</p>
      <p><strong>Body Part:</strong> ${studyData.body_part || 'N/A'}</p>
      <p><strong>Reason for Study:</strong> ${studyData.reason || 'N/A'}</p>

      <h2>Clinical History</h2>
      <p>${studyData.description || 'No clinical history provided.'}</p>

      <h2>Findings</h2>
      <p>Please add findings here...</p>

      <h2>Impression</h2>
      <p>Please add impression here...</p>

      <h2>Recommendations</h2>
      <p>Please add recommendations here...</p>

      <hr />
      <p>Report generated by: ${studyData.radiologist?.name || 'N/A'}</p>
      <p>Date: ${today}</p>
    `;
  };

  // Function to handle image selection
  const handleImageClick = (view: any, event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      
      // Remove selected class from any previously selected image
      document.querySelectorAll('.ProseMirror img.selected').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Add selected class to current image
      img.classList.add('selected');
      
      setSelectedImage(img);
      
      // Calculate current size percentage
      const currentWidth = img.width;
      const naturalWidth = img.naturalWidth;
      const currentSize = Math.round((currentWidth / naturalWidth) * 100);
      setImageSize(currentSize);
      
      return true;
    } else {
      // Only remove selection if clicking outside the toolbar
      const clickTarget = event.target as HTMLElement;
      if (!clickTarget.closest('.image-toolbar')) {
        setSelectedImage(null);
        document.querySelectorAll('.ProseMirror img.selected').forEach(el => {
          el.classList.remove('selected');
        });
      }
    }
    return false;
  };

  // Set up TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: true, // Important for text alignment
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true, // Important for text alignment
        },
      }),
      Underline,
      TableExtension.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-fixed w-full'
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-black'
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-black p-2'
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-black bg-slate-50 p-2 font-bold'
        },
      }),
      Image.configure({
        inline: false, // Change to block image for better alignment
        allowBase64: true,
        HTMLAttributes: {
          class: 'cursor-pointer hover:outline hover:outline-2 hover:outline-blue-500 max-w-full',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    content: '',
    editorProps: {
      handleDOMEvents: {
        click: handleImageClick,
      },
      attributes: {
        class: 'prose max-w-none p-4 h-full focus:outline-none'
      }
    },
    onTransaction: () => {
      setIsEditorReady(prev => !prev);
    },
    onUpdate: ({ editor: updatedEditor }) => {
      setIsEditorReady(prev => !prev);
    },
    immediatelyRender: false
  });
  
  // Update editor content when data is available
  useEffect(() => {
    if (editor && reportData?.content) {
      editor.commands.setContent(reportData.content);
    } else if (editor && studyData) {
      editor.commands.setContent(generateReportTemplate());
    }
  }, [editor, reportData, studyData]);

  // Save report with auto-save functionality
  const saveReport = async (finalize = false) => {
    if (!editor || !studyData) return;
    
    try {
      setSaving(true);
      setSaveProgress(25);
      
      const reportContent = editor.getHTML();
      const status = finalize ? 'finalized' : 'draft';
      
      setSaveProgress(50);
      
      let response;
      if (reportData?.report_id) {
        // Update existing report
        response = await axios.put(`${backendURL}/reports/${reportData.report_id}`, {
          content: reportContent,
          status: status
        });
      } else {
        // Create new report
        response = await axios.post(`${backendURL}/reports`, {
          study_id: studyData.study_id,
          content: reportContent,
          status: status
        });
      }
      
      setSaveProgress(100);
      
      if (finalize) {
        setReportStatus('finalized');
        toast.success('Report finalized successfully');
      } else {
        toast.success('Report saved successfully');
      }
      
      // Update report data
      setReportData({
        ...reportData,
        content: reportContent,
        status: status,
        report_id: response.data.report_id
      });
      
      // Return the saved report
      return response.data;
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setTimeout(() => {
        setSaving(false);
        setSaveProgress(0);
      }, 1000);
    }
  };
  
  // Auto-save functionality
  useEffect(() => {
    if (!editor || reportStatus === 'finalized') return;
    
    const autoSaveInterval = setInterval(() => {
      saveReport();
    }, 60000); // Auto-save every minute
    
    return () => clearInterval(autoSaveInterval);
  }, [editor, reportStatus]);

  // Export report as PDF
  const exportToPdf = async () => {
    if (!editor || !studyData) return;
    
    try {
      setExportingPdf(true);
      
      const reportDiv = document.getElementById('report-preview');
      if (!reportDiv) {
        toast.error('Report preview not found');
        return;
      }
      
      // Set active tab to preview to render content
      setActiveTab('preview');
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(reportDiv, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with appropriate dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm (210mm)
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Add page numbers if multiple pages
      if (imgHeight > 297) { // A4 height is 297mm
        const pageCount = Math.ceil(imgHeight / 297);
        for (let i = 1; i < pageCount; i++) {
          pdf.addPage();
          pdf.addImage(
            imgData, 
            'PNG', 
            0, 
            -(i * 297), 
            imgWidth, 
            imgHeight
          );
          // Add page number at the bottom
          pdf.setFontSize(10);
          pdf.text(`Page ${i + 1} of ${pageCount}`, 105, 290, { align: 'center' });
        }
        // Add page number to first page
        pdf.setPage(1);
        pdf.setFontSize(10);
        pdf.text(`Page 1 of ${pageCount}`, 105, 290, { align: 'center' });
      }
      
      // Save to server if report exists
      if (reportData?.report_id) {
        try {
          // Save HTML content to server
          await axios.post(`${backendURL}/reports/export/${reportData.report_id}`, {
            html_content: editor.getHTML()
          });
        } catch (e) {
          console.error('Error saving report to server:', e);
          // Continue with PDF download even if server save fails
        }
      }
      
      // Download the PDF
      pdf.save(`Report_${studyData.study_id}_${new Date().toISOString().slice(0,10)}.pdf`);
      
      toast.success('Report exported as PDF');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export report as PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  // Helper functions for editor commands
  const toggleHeading = (level: 1 | 2 | 3) => {
    if (!editor) return;
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const toggleList = (type: 'bullet' | 'ordered') => {
    if (!editor) return;
    if (type === 'bullet') {
      editor.chain().focus().toggleBulletList().run();
    } else {
      editor.chain().focus().toggleOrderedList().run();
    }
  };

  // Function to handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  // Function to handle image upload
  const handleImageUpload = async () => {
    if (!selectedFile || !editor) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(`${backendURL}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.url) {
        // Create a temporary URL for preview
        const imageUrl = `${backendURL}${response.data.url}`;
        
        // Insert image into editor
        editor.chain().focus().setImage({ 
          src: imageUrl,
          alt: selectedFile.name,
          title: selectedFile.name
        }).run();

        setIsImageDialogOpen(false);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Function to handle URL image insertion
  const handleUrlImage = async () => {
    if (!imageUrl || !editor) {
      toast.error('Please enter an image URL');
      return;
    }

    try {
      // Test if the URL is valid
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Invalid image URL');
      }

      // Check if the content type is an image
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        throw new Error('URL does not point to a valid image');
      }

      // Insert image into editor
      editor.chain().focus().setImage({ 
        src: imageUrl,
        alt: 'Image from URL',
        title: 'Image from URL'
      }).run();

      setIsImageDialogOpen(false);
      setImageUrl('');
      toast.success('Image inserted successfully');
    } catch (error) {
      console.error('Error inserting image:', error);
      toast.error('Failed to insert image. Please check the URL and try again.');
    }
  };

  // Helper function for inserting tables
  const insertTable = () => {
    if (!editor) return;
    
    editor.chain()
      .focus()
      .insertTable({
        rows: tableRows,
        cols: tableColumns,
        withHeaderRow: includeHeader
      })
      .updateAttributes('table', {
        class: 'border-collapse table-fixed w-full'
      })
      .run();
  };

  // Function to handle table insertion with validation
  const handleTableInsert = () => {
    if (tableRows < 1 || tableColumns < 1) {
      toast.error('Rows and columns must be at least 1');
      return;
    }
    if (tableRows > 50 || tableColumns > 10) {
      toast.error('Maximum size: 50 rows and 10 columns');
      return;
    }
    insertTable();
    setIsTableDialogOpen(false);
  };

  const setTextAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    if (!editor) return;
    editor.chain().focus().setTextAlign(alignment).run();
  };

  // Helper function to check if a format is active
  const isFormatActive = (format: string, attrs = {}) => {
    if (!editor) return false;
    if (Object.keys(attrs).length > 0) {
      return editor.isActive(format, attrs);
    }
    return editor.isActive(format);
  };

  // Helper function for text alignment
  const isAlignmentActive = (alignment: string) => {
    if (!editor) return false;
    return editor.isActive({ textAlign: alignment });
  };

  // Helper function for keyboard shortcuts
  const getShortcut = (key: string) => {
    const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return isMac ? `⌘+${key}` : `Ctrl+${key}`;
  };

  // Function to resize image
  const resizeImage = (increase: boolean) => {
    if (!selectedImage || !editor) return;

    const newSize = increase ? imageSize + 10 : imageSize - 10;
    if (newSize < 10 || newSize > 200) return; // Limit size between 10% and 200%

    // Get the current node position
    const pos = editor.view.posAtDOM(selectedImage, 0);
    if (pos === null) return;

    const naturalWidth = selectedImage.naturalWidth;
    const newWidth = Math.round(naturalWidth * (newSize / 100));

    // Update the image width directly
    selectedImage.style.width = `${newWidth}px`;
    setImageSize(newSize);

    // Mark the document as changed
    editor.view.dispatch(editor.view.state.tr.setMeta('addToHistory', false));
  };

  // Function to align image
  const alignImage = (position: 'left' | 'center' | 'right') => {
    if (!selectedImage || !editor) return;

    // Store current image size
    const currentWidth = selectedImage.style.width || selectedImage.width + 'px';

    // Find the parent node that contains the image
    const parentNode = selectedImage.closest('p, div, h1, h2, h3, h4, h5, h6');
    if (!(parentNode instanceof HTMLElement)) return;

    // Update alignment
    parentNode.style.textAlign = position;
    
    // Maintain image size
    selectedImage.style.width = currentWidth;
    selectedImage.style.display = 'inline-block';
    
    // Update margins based on alignment
    switch (position) {
      case 'left':
        selectedImage.style.margin = '0';
        break;
      case 'center':
        selectedImage.style.margin = '0 auto';
        break;
      case 'right':
        selectedImage.style.margin = '0 0 0 auto';
        break;
    }

    // Update editor state using commands
    editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        if (!dispatch) return false;

        const pos = editor.view.posAtDOM(selectedImage, 0);
        if (pos === null) return false;

        const $pos = tr.doc.resolve(pos);
        const node = $pos.node();
        
        if (!node) return false;

        // Find the parent paragraph node
        let depth = $pos.depth;
        while (depth > 0 && $pos.node(depth).type.name !== 'paragraph') {
          depth -= 1;
        }

        // If we found a paragraph, update its alignment
        if (depth > 0) {
          const paragraphPos = $pos.before(depth);
          tr.setNodeMarkup(paragraphPos, undefined, {
            ...$pos.node(depth).attrs,
            style: `text-align: ${position};`,
          });
          dispatch(tr);
          return true;
        }

        return false;
      })
      .run();
  };

  // Function to delete image
  const deleteImage = () => {
    if (!selectedImage || !editor) return;
    
    const pos = editor.view.posAtDOM(selectedImage, 0);
    if (pos === null) return;

    // Remove the entire node containing the image
    const tr = editor.view.state.tr.delete(pos - 1, pos + 1);
    editor.view.dispatch(tr);
    setSelectedImage(null);
  };

  // Update CSS for image containers
  useEffect(() => {
    if (editor) {
      const style = document.createElement('style');
      style.textContent = `
        .ProseMirror {
          position: relative;
        }
        .ProseMirror p {
          position: relative;
          margin: 1em 0;
          min-height: 1.5em;
        }
        .ProseMirror img {
          display: inline-block;
          height: auto;
          transition: all 0.2s ease-in-out;
          vertical-align: middle;
        }
        .ProseMirror img.selected {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
        .image-toolbar {
          position: fixed;
          z-index: 50;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
          display: flex;
          gap: 0.5rem;
          transform: translateX(-50%);
          transition: all 0.2s ease-in-out;
        }
        .image-toolbar button {
          padding: 0.25rem;
          border-radius: 0.25rem;
          border: 1px solid #e5e7eb;
        }
        .image-toolbar button:hover {
          background-color: #f3f4f6;
        }
        .image-toolbar button.active {
          background-color: #e5e7eb;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [editor]);

  if (!studyId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Study Selected</h2>
          <p className="text-gray-600">Please select a study to create or edit a report.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 border-opacity-50 mx-auto"></div>
          <p className="mt-4">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with title and status */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">
              {reportData?.report_id ? 'Edit Report' : 'Create Report'} - Study #{studyData?.study_id}
            </h1>
            <div className="flex items-center space-x-2">
              {reportStatus === 'finalized' && (
                <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Finalized
                </span>
              )}
              {reportStatus === 'draft' && (
                <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Draft
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Tabs and Toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        {/* Tabs */}
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'edit' | 'preview')} className="w-full">
            <TabsList className="mb-0 border-b-0">
              <TabsTrigger value="edit">Edit Report</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Editor toolbar */}
        {activeTab === 'edit' && (
          <div className="border-t">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap gap-1 py-2">
                {/* Text Style Group */}
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-md">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => editor?.chain().focus().toggleBold().run()}
                          className={`${getActiveButtonClass(isFormatActive('bold'))} border`}
                          disabled={!editor?.can().chain().focus().toggleBold().run()}
                        >
                          <Bold size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Bold ({getShortcut('B')})</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => editor?.chain().focus().toggleItalic().run()}
                          className={`${getActiveButtonClass(isFormatActive('italic'))} border`}
                          disabled={!editor?.can().chain().focus().toggleItalic().run()}
                        >
                          <Italic size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Italic ({getShortcut('I')})</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => editor?.chain().focus().toggleUnderline().run()}
                          className={`${getActiveButtonClass(isFormatActive('underline'))} border`}
                          disabled={!editor?.can().chain().focus().toggleUnderline().run()}
                        >
                          <UnderlineIcon size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Underline ({getShortcut('U')})</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="border-r mx-2 h-6"></div>

                {/* Alignment Group */}
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-md">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setTextAlign('left')}
                          className={`${getActiveButtonClass(isAlignmentActive('left'))} border`}
                          disabled={!editor?.can().chain().focus().setTextAlign('left').run()}
                        >
                          <AlignLeft size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Align Left</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setTextAlign('center')}
                          className={`${getActiveButtonClass(isAlignmentActive('center'))} border`}
                          disabled={!editor?.can().chain().focus().setTextAlign('center').run()}
                        >
                          <AlignCenter size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Align Center</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setTextAlign('right')}
                          className={`${getActiveButtonClass(isAlignmentActive('right'))} border`}
                          disabled={!editor?.can().chain().focus().setTextAlign('right').run()}
                        >
                          <AlignRight size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Align Right</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setTextAlign('justify')}
                          className={`${getActiveButtonClass(isAlignmentActive('justify'))} border`}
                          disabled={!editor?.can().chain().focus().setTextAlign('justify').run()}
                        >
                          <AlignJustify size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Justify</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="border-r mx-2 h-6"></div>

                {/* Heading Group */}
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-md">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleHeading(1)}
                          className={`${getActiveButtonClass(isFormatActive('heading', { level: 1 }))} border font-bold`}
                          disabled={!editor?.can().chain().focus().toggleHeading({ level: 1 }).run()}
                        >
                          H1
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Heading 1</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleHeading(2)}
                          className={`${getActiveButtonClass(isFormatActive('heading', { level: 2 }))} border font-bold`}
                          disabled={!editor?.can().chain().focus().toggleHeading({ level: 2 }).run()}
                        >
                          H2
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Heading 2</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleHeading(3)}
                          className={`${getActiveButtonClass(isFormatActive('heading', { level: 3 }))} border font-bold`}
                          disabled={!editor?.can().chain().focus().toggleHeading({ level: 3 }).run()}
                        >
                          H3
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Heading 3</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="border-r mx-2 h-6"></div>

                {/* List Group */}
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-md">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleList('bullet')}
                          className={`${getActiveButtonClass(isFormatActive('bulletList'))} border`}
                          disabled={!editor?.can().chain().focus().toggleBulletList().run()}
                        >
                          <List size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Bullet List</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleList('ordered')}
                          className={`${getActiveButtonClass(isFormatActive('orderedList'))} border`}
                          disabled={!editor?.can().chain().focus().toggleOrderedList().run()}
                        >
                          <ListOrdered size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Numbered List</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="border-r mx-2 h-6"></div>

                {/* Insert Group */}
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-md">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsImageDialogOpen(true)}
                          className="border hover:bg-slate-100"
                        >
                          <ImageIcon size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Insert Image</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsTableDialogOpen(true)}
                          className="border hover:bg-slate-100"
                        >
                          <TableIcon size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Insert Table</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content with adjusted padding for fixed header */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Editor/Preview content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 h-full">
            {activeTab === 'edit' ? (
              <EditorContent 
                editor={editor} 
                className={`${styles.editorContent} prose max-w-none bg-white rounded-lg shadow-sm min-h-full`} 
              />
            ) : (
              <div id="report-preview" className={styles.previewContent}>
                <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }} />
              </div>
            )}
          </div>
        </div>

        {/* Footer with actions */}
        <div className="bg-white border-t shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {reportStatus === 'draft' ? (
                  <span className="text-xs text-gray-500">
                    Auto-save enabled
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 flex items-center">
                    <AlertCircle size={14} className="mr-1 text-green-600" />
                    Report is finalized
                  </span>
                )}
              </div>
              
              <div className="space-x-2">
                {reportStatus !== 'finalized' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => saveReport()}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                    
                    <Button
                      onClick={() => saveReport(true)}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Finalize Report
                    </Button>
                  </>
                )}
                
                <Button
                  variant="outline"
                  onClick={exportToPdf}
                  disabled={exportingPdf}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Insert Dialog */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Insert Table</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rows">Number of Rows</Label>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  max="50"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                  className="col-span-3"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="columns">Number of Columns</Label>
                <Input
                  id="columns"
                  type="number"
                  min="1"
                  max="10"
                  value={tableColumns}
                  onChange={(e) => setTableColumns(parseInt(e.target.value) || 1)}
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="header"
                checked={includeHeader}
                onCheckedChange={(checked) => setIncludeHeader(checked as boolean)}
              />
              <Label htmlFor="header">Include header row</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTableInsert}>
              Insert Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Insert Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          
          </DialogHeader>
          
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="upload">Upload Image</TabsTrigger>
              
            </TabsList>
            
            <TabsContent value="upload" className="mt-4">
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="image">Image</Label>
                  <Input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </div>
                {selectedFile && (
                  <div className="text-sm text-gray-500">
                    Selected: {selectedFile.name}
                  </div>
                )}
                <Button
                  onClick={handleImageUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <span className="mr-2">Uploading...</span>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    </div>
                  ) : (
                    'Upload Image'
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="mt-4">
              <div className="space-y-4">
                
                <Button
                  onClick={handleUrlImage}
                  disabled={!imageUrl}
                  className="w-full"
                >
                  Insert Image
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImageDialogOpen(false);
                setSelectedFile(null);
                setImageUrl('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Toolbar */}
      {selectedImage && activeTab === 'edit' && (
        <div 
          className="image-toolbar"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-center gap-2">
            {/* Size Controls */}
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-md">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resizeImage(false)}
                      className="border hover:bg-slate-100"
                    >
                      <Minimize2 size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Decrease Size</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span className="text-sm font-medium w-12 text-center">
                {imageSize}%
              </span>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resizeImage(true)}
                      className="border hover:bg-slate-100"
                    >
                      <Maximize2 size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Increase Size</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="border-r h-6"></div>

            {/* Alignment Controls */}
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-md">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => alignImage('left')}
                      className={`border hover:bg-slate-100 ${
                        selectedImage?.closest('p')?.style.textAlign === 'left' ? 'bg-slate-200' : ''
                      }`}
                    >
                      <MoveLeft size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Left</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => alignImage('center')}
                      className={`border hover:bg-slate-100 ${
                        selectedImage?.closest('p')?.style.textAlign === 'center' ? 'bg-slate-200' : ''
                      }`}
                    >
                      <ImageCenter size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Center</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => alignImage('right')}
                      className={`border hover:bg-slate-100 ${
                        selectedImage?.closest('p')?.style.textAlign === 'right' ? 'bg-slate-200' : ''
                      }`}
                    >
                      <MoveRight size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Align Right</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="border-r h-6"></div>

            {/* Delete Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteImage}
                    className="border hover:bg-red-100 text-red-600"
                  >
                    <Trash2 size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Image</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
} 
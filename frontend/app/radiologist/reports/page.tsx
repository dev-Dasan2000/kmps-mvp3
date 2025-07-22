'use client';

import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
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
import { useRouter, useSearchParams } from 'next/navigation';
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
import { AuthContext } from '@/context/auth-context';

// Types
interface Study {
  study_id: number;
  patient_id: string;
  patient?: {
    name: string;
    date_of_birth?: string;
    gender?: string;
    blood_group?: string;
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
  const [logoImage, setLogoImage] = useState<string | null>(null);
  
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

  // Add state for tracking selected image attributes
  const [selectedImageAttrs, setSelectedImageAttrs] = useState<ImageAttributes | null>(null);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const {isLoadingAuth, isLoggedIn, apiClient, user} = useContext(AuthContext);
  const router = useRouter();

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      toast.error("Please Login");
      router.push("/");
    }
    else if(user.role != "radiologist"){
      toast.error("Access Denied");
      router.push("/");
    }
  },[])

  // Fetch study and report data
  useEffect(() => {
    if (!studyId) return;
    
    const fetchData = async () => {
      try {
        // Fetch study data
        const studyResponse = await apiClient.get(`/studies/${studyId}`);
        setStudyData(studyResponse.data);
        
        // If study has a report, fetch it
        if (studyResponse.data.report_id) {
          const reportResponse = await apiClient.get(`/reports/${studyResponse.data.report_id}`);
          setReportData(reportResponse.data);
          setReportStatus(reportResponse.data.status);
        }

        // Use a logo from public folder
        setLogoImage('/logo.png');
        
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
    
    return `
      <h2>Clinical History</h2>
      <p>${studyData.description || 'No clinical history provided.'}</p>

      <h2>Findings</h2>
      <p>[Please describe the radiological findings here]</p>

      <h2>Impression</h2>
      <p>[Please provide your radiological impression here]</p>

      <h2>Recommendations</h2>
      <p>[Please provide any recommendations for follow-up or additional studies if needed]</p>
    `;
  };

  // Image handling types
  interface ImageAttributes {
    src: string;
    alt?: string;
    title?: string;
    width?: number;
    alignment?: 'left' | 'center' | 'right';
  }

  interface ImageNode {
    type: { name: string };
    attrs: ImageAttributes;
  }

  // Set up TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: (level: number) => {
            switch (level) {
              case 1:
                return { class: 'text-[#0d7d85] text-[1.8rem] font-bold' };
              case 2:
                return { class: 'text-[#0d7d85] text-[1.4rem] font-bold' };
              case 3:
                return { class: 'text-[#0d7d85] text-[1.2rem] font-bold' };
              default:
                return {};
            }
          }
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
          HTMLAttributes: {
            class: 'list-disc ml-6 space-y-2'
          }
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true,
          HTMLAttributes: {
            class: 'list-decimal ml-6 space-y-2'
          }
        },
        listItem: {
          HTMLAttributes: {
            class: 'pl-2'
          }
        }
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'cursor-pointer hover:outline hover:outline-2 hover:outline-blue-500 max-w-full'
        },
        renderHTML: ({ HTMLAttributes }) => {
          const { alignment, width, ...rest } = HTMLAttributes;
          const style = `
            display: block;
            width: ${width || 100}%;
            ${alignment === 'center' ? 'margin: 0 auto;' : 
              alignment === 'right' ? 'margin-left: auto;' : ''}
          `;
          return ['img', { ...rest, style }];
        }
      }),
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
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    content: '',
    editorProps: {
      handleDOMEvents: {
        click: (view: any, event: MouseEvent) => {
          const target = event.target as HTMLElement;
          if (target.tagName === 'IMG') {
            const { state } = view;
            const { selection } = state;
            
            // Find image node in selection
            let imagePos = -1;
            let imageNode: ImageNode | null = null;
            
            state.doc.nodesBetween(selection.from, selection.to, (node: any, pos: number) => {
              if (node.type.name === 'image') {
                imagePos = pos;
                imageNode = node;
                return false;
              }
            });

            if (imagePos > -1 && imageNode) {
              // Set node selection
              editor?.chain()
                .focus()
                .setNodeSelection(imagePos)
                .run();
              
              // Update UI state
              const width = imageNode.attrs.width || 100;
              setImageSize(width);
              return true;
            }
          }
          return false;
        },
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

  // Function to get selected image node
  const getSelectedImageNode = useCallback(() => {
    if (!editor) return null;
    
    const { state } = editor;
    const { selection } = state;
    
    // Find image node in selection
    let imagePos = -1;
    let imageNode: ImageNode | null = null;
    
    state.doc.nodesBetween(selection.from, selection.to, (node: any, pos: number) => {
      if (node.type.name === 'image') {
        imagePos = pos;
        imageNode = node;
        return false;
      }
    });
    
    return imagePos > -1 ? { node: imageNode, pos: imagePos } : null;
  }, [editor]);

  // Update image attributes tracking when selection changes
  useEffect(() => {
    if (!editor) return;

    const updateSelectedImage = () => {
      if (editor.isActive('image')) {
        const attrs = editor.getAttributes('image');
        setSelectedImageAttrs({
          src: attrs.src,
          width: attrs.width || 100,
          alignment: attrs.alignment || 'left'
        });
        setImageSize(attrs.width || 100);
      } else {
        setSelectedImageAttrs(null);
        setImageSize(100);
      }
    };

    // Update on selection change
    editor.on('selectionUpdate', updateSelectedImage);
    // Update on transaction (content change)
    editor.on('transaction', updateSelectedImage);

    return () => {
      editor.off('selectionUpdate', updateSelectedImage);
      editor.off('transaction', updateSelectedImage);
    };
  }, [editor]);

  // Function to update image attributes
  const updateImageAttributes = useCallback((attrs: Partial<ImageAttributes>) => {
    if (!editor) return;
    
    editor.chain()
      .focus()
      .updateAttributes('image', attrs)
      .run();

    // Update local state
    setSelectedImageAttrs(prev => prev ? { ...prev, ...attrs } : null);
    if (attrs.width) {
      setImageSize(attrs.width);
    }
  }, [editor]);

  // Image upload handler
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
        const imageUrl = `${backendURL}${response.data.url}`;
        
        // Insert image with initial attributes
        editor.chain().focus().setImage({ 
          src: imageUrl,
          alt: selectedFile.name,
          title: selectedFile.name,
          width: 100,
          alignment: 'left' // Set default alignment
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

  // Image resize handler
  const resizeImage = useCallback((increase: boolean) => {
    if (!editor || !selectedImageAttrs) return;
    
    const currentWidth = selectedImageAttrs.width || 100;
    const newSize = Math.min(Math.max(increase ? currentWidth + 10 : currentWidth - 10, 10), 200);
    
    updateImageAttributes({ width: newSize });
  }, [editor, selectedImageAttrs, updateImageAttributes]);

  // Image alignment handler
  const alignImage = useCallback((position: 'left' | 'center' | 'right') => {
    if (!editor) return;

    // Get the current image node
    const imageInfo = getSelectedImageNode();
    if (!imageInfo || !imageInfo.node) return;

    // Get current attributes
    const currentAttrs = editor.getAttributes('image');
    
    // Update image attributes
    editor.chain()
      .focus()
      .setNodeSelection(imageInfo.pos)
      .updateAttributes('image', {
        ...currentAttrs,
        alignment: position
      })
      .run();

    // Update local state
    setSelectedImageAttrs(prev => prev ? { ...prev, alignment: position } : null);
  }, [editor, getSelectedImageNode]);

  // Image delete handler
  const deleteImage = useCallback(() => {
    if (!editor) return;
    
    const imageInfo = getSelectedImageNode();
    if (!imageInfo) return;
    
    editor.chain()
      .focus()
      .setNodeSelection(imageInfo.pos)
      .deleteSelection()
      .run();
  }, [editor, getSelectedImageNode]);

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
        response = await apiClient.put(`/reports/${reportData.report_id}`, {
          content: reportContent,
          status: status
        });
      } else {
        // Create new report
        response = await apiClient.post(`/reports`, {
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
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [editor, reportStatus]);

  // Create preview component for PDF generation that includes header and footer
  const generatePdfPreview = () => {
    if (!editor || !studyData) return null;
    
    // Process content to extract sections and calculate page breaks
    const processedContent = calculatePageBreaks(editor.getHTML());
    
    return (
      <div id="pdf-preview" className={styles.pagesContainer}>
        {processedContent.pages.map((page, index) => (
          <div key={index} className={styles.pagePreview}>
            {/* Only add header on first page */}
            {index === 0 && (
              <>
                {/* PDF Header */}
                <div className={styles.pdfHeader}>
                  <div className={styles.pdfLogo}>
                    {logoImage && <img src={logoImage} alt="Dentax Logo" />}
                    <h2>DENTAX</h2>
                  </div>
                  <div className={styles.pdfTitle}>
                    <h3>RADIOLOGY REPORT</h3>
                    <p>Study #{studyData.study_id}</p>
                  </div>
                </div>

                {/* Report Header (Patient & Study Info) */}
                <div className={styles.reportHeader}>
                  <div className={styles.reportTitle}>
                    <h1>RADIOLOGY REPORT</h1>
                  </div>
                  <div className={styles.infoGrid}>
                    {/* Patient Information */}
                    <div className={styles.infoSection}>
                      <h2>Patient Information</h2>
                      <dl>
                        <dt>Name</dt>
                        <dd><strong>{studyData?.patient?.name || 'N/A'}</strong></dd>
                        
                        <dt>Patient ID</dt>
                        <dd><strong>{studyData?.patient_id || 'N/A'}</strong></dd>
                        
                        <dt>Date of Birth</dt>
                        <dd>{formatDate(studyData?.patient?.date_of_birth)}</dd>
                        
                        <dt>Age</dt>
                        <dd>{calculateAge(studyData?.patient?.date_of_birth)}</dd>
                        
                        <dt>Gender</dt>
                        <dd>{studyData?.patient?.gender || 'N/A'}</dd>
                        
                        <dt>Blood Group</dt>
                        <dd>{studyData?.patient?.blood_group?.toUpperCase() || 'N/A'}</dd>
                      </dl>
                    </div>

                    {/* Study Information */}
                    <div className={styles.infoSection}>
                      <h2>Study Information</h2>
                      <dl>
                        <dt>Study ID</dt>
                        <dd><strong>{studyData?.study_id || 'N/A'}</strong></dd>
                        
                        <dt>Date</dt>
                        <dd><strong>{formatDate(studyData?.date)}</strong></dd>
                        
                        <dt>Time</dt>
                        <dd>{formatTime(studyData?.time)}</dd>
                        
                        <dt>Modality</dt>
                        <dd><strong>{studyData?.modality || 'N/A'}</strong></dd>
                        
                        <dt>Body Part</dt>
                        <dd><strong>{studyData?.body_part || 'N/A'}</strong></dd>
                        
                        <dt>Radiologist</dt>
                        <dd><strong>{studyData?.radiologist?.name || 'N/A'}</strong></dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Page Content */}
            <div 
              className={styles.reportContent} 
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
            
            {/* PDF Footer */}
            <div className={styles.pdfFooter}>
              <div className={styles.radiologistInfo}>
                <span><strong>Radiologist:</strong> {studyData.radiologist?.name || 'N/A'}</span>
                <span><strong>Date:</strong> {formatDate(new Date().toISOString())}</span>
              </div>
              <div className={styles.pageInfo}>
                Page {index + 1} of {processedContent.pages.length}
              </div>
              <div className={styles.systemInfo}>
                Generated by Dentax Imaging System
              </div>
            </div>
            
            {/* Page Number Overlay */}
            <div className={styles.pageNumber}>
              {index + 1}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to calculate page breaks and split content into pages
  const calculatePageBreaks = (content: string): { pages: Array<{ content: string }> } => {
    // Create a temporary div to process the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processContentWithPageBreaks(content);
    
    // Get all top-level elements for pagination
    const elements = Array.from(tempDiv.children);
    
    // Estimate content height per element (rough approximation)
    // In a real implementation, you would need a more sophisticated algorithm
    // that measures actual rendered heights
    const avgLineHeight = 25; // pixels
    const linesPerPage = 35; // Estimate of lines that fit on a page after header/footer
    const maxLinesFirstPage = 20; // First page has header which takes space
    
    const pages: Array<{ content: string }> = [];
    let currentPage = document.createElement('div');
    let currentPageLines = 0;
    let maxLinesForCurrentPage = maxLinesFirstPage; // First page has header
    
    elements.forEach(element => {
      // Rough estimate of lines needed for this element
      let elementLines = 0;
      
      // Headings
      if (/h[1-6]/i.test(element.tagName)) {
        elementLines = 2;
      } 
      // Paragraphs - estimate based on text length
      else if (element.tagName === 'P') {
        const words = element.textContent?.split(' ').length || 0;
        elementLines = Math.ceil(words / 10); // Assuming ~10 words per line
      }
      // Lists - count items
      else if (['UL', 'OL'].includes(element.tagName)) {
        elementLines = element.children.length + 1;
      }
      // Tables - count rows
      else if (element.tagName === 'TABLE') {
        elementLines = element.querySelectorAll('tr').length * 2;
      }
      // Default for other elements
      else {
        elementLines = 2;
      }
      
      // If adding this element would exceed page capacity, start a new page
      if (currentPageLines + elementLines > maxLinesForCurrentPage) {
        pages.push({ content: currentPage.innerHTML });
        currentPage = document.createElement('div');
        currentPageLines = 0;
        maxLinesForCurrentPage = linesPerPage; // Subsequent pages don't have header
      }
      
      // Add the element to the current page
      currentPage.appendChild(element.cloneNode(true));
      currentPageLines += elementLines;
    });
    
    // Add the final page if it has content
    if (currentPage.innerHTML) {
      pages.push({ content: currentPage.innerHTML });
    }
    
    // Ensure we have at least one page
    if (pages.length === 0) {
      pages.push({ content: '' });
    }
    
    return { pages };
  };

  // Helper function to process content and add page break indicators
  const processContentWithPageBreaks = (content: string): string => {
    // Create a temporary div to process the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Replace any oklch colors with standard hex/rgb colors
    const elementsWithStyle = tempDiv.querySelectorAll('[style*="oklch"]');
    elementsWithStyle.forEach(element => {
      const el = element as HTMLElement;
      const style = el.getAttribute('style') || '';
      // Replace oklch colors with standard teal color
      if (style.includes('oklch')) {
        const newStyle = style.replace(/oklch\([^)]+\)/g, '#0d7d85');
        el.setAttribute('style', newStyle);
      }
    });
    
    // Process headings to avoid page breaks after them
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.classList.add('keep-with-next');
      // Set heading color to standard hex
      const h = heading as HTMLElement;
      h.style.color = '#0d7d85';
    });
    
    // Process paragraphs for better text flow
    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach(paragraph => {
      // Add style to prevent orphans and widows
      const p = paragraph as HTMLElement;
      p.style.orphans = '3';
      p.style.widows = '3';
      
      // Ensure text doesn't overflow
      if (p.textContent && p.textContent.length > 100) {
        p.style.wordWrap = 'break-word';
        p.style.overflowWrap = 'break-word';
      }
    });
    
    // Process tables for better handling
    const tables = tempDiv.querySelectorAll('table');
    tables.forEach(table => {
      const t = table as HTMLTableElement;
      t.style.tableLayout = 'fixed';
      t.style.width = '100%';
      t.style.maxWidth = '100%';
      
      // Process cells to prevent overflow
      const cells = table.querySelectorAll('th, td');
      cells.forEach(cell => {
        const c = cell as HTMLTableCellElement;
        c.style.wordBreak = 'break-word';
        c.style.overflowWrap = 'break-word';
        c.style.maxWidth = '0'; // Forces content to respect cell width
      });
    });
    
    return tempDiv.innerHTML;
  };

  // Export report as PDF
  const exportToPdf = async () => {
    if (!editor || !studyData) return;
    
    try {
      setExportingPdf(true);
      
      // Simple approach - create PDF directly without relying on complex color parsing
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Set basic information
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      // Reset cursor position
      let yPosition = margin;
      
      // Add header - simple text version instead of image
      pdf.setFillColor(13, 125, 133); // #0d7d85 in RGB
      pdf.rect(0, 0, pageWidth, 25, 'F');
      
      // Add DENTAX title
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("DENTAX", margin, 15);
      
      // Add report title
      pdf.setFontSize(14);
      pdf.text("RADIOLOGY REPORT", pageWidth - margin - 45, 15);
      
      yPosition = 35; // Move position below header
      
      // Add report title
      pdf.setTextColor(13, 125, 133); // #0d7d85 in RGB
      pdf.setFontSize(18);
      pdf.text("RADIOLOGY REPORT", pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      
      // Draw a separator line
      pdf.setDrawColor(13, 125, 133); // #0d7d85 in RGB
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      
      yPosition += 10;
      
      // Patient Information Section
      pdf.setTextColor(13, 125, 133);
      pdf.setFontSize(14);
      pdf.text("Patient Information", margin, yPosition);
      
      yPosition += 7;
      
      // Reset to normal text
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      
      // Patient details
      pdf.setFont("helvetica", "bold");
      pdf.text("Name:", margin, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${studyData.patient?.name || 'N/A'}`, margin + 30, yPosition);
      
      yPosition += 6;
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Patient ID:", margin, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${studyData.patient_id || 'N/A'}`, margin + 30, yPosition);
      
      yPosition += 6;
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Date of Birth:", margin, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${formatDate(studyData.patient?.date_of_birth) || 'N/A'}`, margin + 30, yPosition);
      
      yPosition += 6;
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Gender:", margin, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${studyData.patient?.gender || 'N/A'}`, margin + 30, yPosition);
      
      // Study Information (right column)
      const rightColumn = pageWidth / 2 + 10;
      
      // Reset y position for the right column
      let rightColumnY = yPosition - 18;
      
      pdf.setTextColor(13, 125, 133);
      pdf.setFontSize(14);
      pdf.text("Study Information", rightColumn, rightColumnY);
      
      rightColumnY += 7;
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      
      // Study details
      pdf.setFont("helvetica", "bold");
      pdf.text("Study ID:", rightColumn, rightColumnY);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${studyData.study_id || 'N/A'}`, rightColumn + 30, rightColumnY);
      
      rightColumnY += 6;
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Date:", rightColumn, rightColumnY);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${formatDate(studyData.date) || 'N/A'}`, rightColumn + 30, rightColumnY);
      
      rightColumnY += 6;
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Modality:", rightColumn, rightColumnY);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${studyData.modality || 'N/A'}`, rightColumn + 30, rightColumnY);
      
      rightColumnY += 6;
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Radiologist:", rightColumn, rightColumnY);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${studyData.radiologist?.name || 'N/A'}`, rightColumn + 30, rightColumnY);
      
      // Update position to the maximum of both columns
      yPosition = Math.max(yPosition, rightColumnY) + 10;
      
      // Convert HTML report content to plain text to avoid parsing issues
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editor.getHTML();
      
      // Extract sections
      interface Section {
        title: string;
        content: string;
      }

      const sections: Section[] = [];
      const headings = tempDiv.querySelectorAll('h1, h2, h3');
      
      headings.forEach(heading => {
        let section: Section = {
          title: heading.textContent || '',
          content: ''
        };
        
        // Get all next siblings until the next heading
        let nextNode = heading.nextElementSibling;
        while (nextNode && !['H1', 'H2', 'H3'].includes(nextNode.tagName)) {
          // If it's a paragraph, add its text content
          if (nextNode.tagName === 'P') {
            section.content += nextNode.textContent + '\n\n';
          }
          // If it's a list, process its items
          else if (['UL', 'OL'].includes(nextNode.tagName)) {
            const items = nextNode.querySelectorAll('li');
            items.forEach((item, index) => {
              section.content += `• ${item.textContent}\n`;
            });
            section.content += '\n';
          }
          nextNode = nextNode.nextElementSibling;
        }
        
        sections.push(section);
      });
      
      // Add sections to PDF
      for (const section of sections) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Add section title
        pdf.setTextColor(13, 125, 133);
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(section.title, margin, yPosition);
        
        yPosition += 7;
        
        // Add section content
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        
        // Split text into lines to manage wrapping
        const textLines = pdf.splitTextToSize(section.content, contentWidth);
        pdf.text(textLines, margin, yPosition);
        
        // Update position for next section
        yPosition += textLines.length * 6 + 10;
      }
      
      // Add footer on each page
      const totalPages = pdf.getNumberOfPages();
      
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Add footer background
        pdf.setFillColor(241, 245, 249); // #f1f5f9 in RGB
        pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        // Add footer text
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        
        // Radiologist info
        pdf.text(`Radiologist: ${studyData.radiologist?.name || 'N/A'}`, margin, pageHeight - 5);
        
        // Page number
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        
        // System info
        pdf.text("Generated by Dentax Imaging System", pageWidth - margin, pageHeight - 5, { align: 'right' });
      }
      
      // Save to server if report exists
      if (reportData?.report_id) {
        try {
          await apiClient.post(`/reports/export/${reportData.report_id}`, {
            html_content: editor.getHTML()
          });
        } catch (e) {
          console.error('Error saving report to server:', e);
        }
      }
      
      // Download the PDF with a meaningful name
      const patientName = studyData.patient?.name?.replace(/\s+/g, '_') || 'Patient';
      const currentDate = new Date().toISOString().slice(0,10);
      pdf.save(`Dentax_Report_${patientName}_${studyData.study_id}_${currentDate}.pdf`);
      
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

  // List toggle handlers
  const toggleBulletList = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleOrderedList().run();
  }, [editor]);

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

  // Add CSS for image alignment
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ProseMirror img[style*="margin: 0 auto"] {
        display: block;
        margin: 0 auto;
      }
      .ProseMirror img[style*="margin-left: auto"] {
        display: block;
        margin-left: auto;
      }
      .ProseMirror img {
        display: block;
        max-width: 100%;
        height: auto;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add CSS for lists
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ProseMirror ul {
        list-style-type: disc;
        padding-left: 1.5rem;
        margin: 0.5rem 0;
      }
      .ProseMirror ol {
        list-style-type: decimal;
        padding-left: 1.5rem;
        margin: 0.5rem 0;
      }
      .ProseMirror li {
        margin: 0.25rem 0;
        padding-left: 0.5rem;
      }
      .ProseMirror li p {
        margin: 0;
      }
      .ProseMirror li.task-list-item {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to format time
  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  // Function to calculate age
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} years`;
  };

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
                          onClick={toggleBulletList}
                          className={`${getActiveButtonClass(editor?.isActive('bulletList'))} border`}
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
                          onClick={toggleOrderedList}
                          className={`${getActiveButtonClass(editor?.isActive('orderedList'))} border`}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Editor/Preview content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 h-full">
            {activeTab === 'edit' ? (
              <>
                {/* Report Header */}
                <div className={styles.reportHeader}>
                  <div className={styles.reportTitle}>
                    <h1>RADIOLOGY REPORT</h1>
                  </div>
                  <div className={styles.infoGrid}>
                    {/* Patient Information */}
                    <div className={styles.infoSection}>
                      <h2>Patient Information</h2>
                      <dl>
                        <dt>Name</dt>
                        <dd>{studyData?.patient?.name || 'N/A'}</dd>
                        
                        <dt>Patient ID</dt>
                        <dd>{studyData?.patient_id || 'N/A'}</dd>
                        
                        <dt>Date of Birth</dt>
                        <dd>{formatDate(studyData?.patient?.date_of_birth)}</dd>
                        
                        <dt>Age</dt>
                        <dd>{calculateAge(studyData?.patient?.date_of_birth)}</dd>
                        
                        <dt>Gender</dt>
                        <dd>{studyData?.patient?.gender || 'N/A'}</dd>
                        
                        <dt>Blood Group</dt>
                        <dd>{studyData?.patient?.blood_group?.toUpperCase() || 'N/A'}</dd>
                      </dl>
                    </div>

                    {/* Study Information */}
                    <div className={styles.infoSection}>
                      <h2>Study Information</h2>
                      <dl>
                        <dt>Study ID</dt>
                        <dd>{studyData?.study_id || 'N/A'}</dd>
                        
                        <dt>Date</dt>
                        <dd>{formatDate(studyData?.date)}</dd>
                        
                        <dt>Time</dt>
                        <dd>{formatTime(studyData?.time)}</dd>
                        
                        <dt>Modality</dt>
                        <dd>{studyData?.modality || 'N/A'}</dd>
                        
                        <dt>Body Part</dt>
                        <dd>{studyData?.body_part || 'N/A'}</dd>
                        
                        <dt>Radiologist</dt>
                        <dd>{studyData?.radiologist?.name || 'N/A'}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Editor Content */}
                <div className={styles.editor}>
                  <EditorContent 
                    editor={editor} 
                    className={`${styles.editorContent} prose max-w-none bg-white rounded-lg shadow-sm min-h-full`} 
                  />
                </div>

                {/* Image Toolbar - Show when image is selected */}
                {editor?.isActive('image') && (
                  <div 
                    className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50 flex items-center gap-2"
                  >
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
                        {selectedImageAttrs?.width || 100}%
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
                                selectedImageAttrs?.alignment === 'left' ? 'bg-slate-200' : ''
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
                                selectedImageAttrs?.alignment === 'center' ? 'bg-slate-200' : ''
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
                                selectedImageAttrs?.alignment === 'right' ? 'bg-slate-200' : ''
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
                )}
              </>
            ) : (
              <div id="report-preview">
                {/* PDF Preview */}
                {generatePdfPreview()}
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
    </div>
  );
} 
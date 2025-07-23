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

  // Add ref for the preview container
  const previewContainerRef = useRef<HTMLDivElement>(null);

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
      <p>[Please provide any recommendations for follow-up or additional details if needed]</p>
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
    let imageNode: any = null;
    
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

    // Update using TextAlign extension instead
    editor.chain()
      .focus()
      .setNodeSelection(imageInfo.pos)
      .setTextAlign(position)
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
      
      setSaveProgress(75);
      
      // If finalizing, generate a PDF with signature and export to server
      if (finalize && user?.role === 'radiologist') {
        try {
          // Get radiologist signature
          const radiologistResponse = await apiClient.get(`/radiologists/${user.id}`);
          const radiologistData = radiologistResponse.data;
          const signatureUrl = radiologistData.signature ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${radiologistData.signature}` : null;
          
          // Generate and export PDF with signature
          await exportFinalizedPdf(reportContent, signatureUrl);
          
          toast.success('Report finalized and PDF saved successfully');
        } catch (error) {
          console.error("Error generating finalized PDF:", error);
          toast.error("Report was finalized but PDF export failed");
        }
      }
      
      setSaveProgress(100);
      
      if (finalize) {
        setReportStatus('finalized');
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
    
    // Get the raw HTML content from editor
    const editorContent = editor.getHTML();
    
    // Basic content division into pages
    const dividedContent = divideContentIntoPages(editorContent);
    
    console.log(`Generated ${dividedContent.length} preview pages`);
    
    return (
      <div 
        id="pdf-preview" 
        className={styles.pagesContainer} 
        data-page-count={dividedContent.length}
        ref={previewContainerRef}
        data-preview-container="true"
      >
        {dividedContent.map((pageContent, pageIndex) => (
          <div 
            key={pageIndex} 
            className={`${styles.pagePreview} printPage pdf-page`}
            data-page-number={pageIndex + 1}
            data-is-preview-page="true"
            id={`preview-page-${pageIndex + 1}`}
          >
            {/* Page Header - Only on first page */}
            {pageIndex === 0 && (
              <div className={styles.pageHeader}>
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
              </div>
            )}

            {/* Page Content Area */}
            <div className={styles.pageContentArea}>
              <div 
                className={styles.reportContent} 
                dangerouslySetInnerHTML={{ __html: pageContent }}
              />
            </div>
            
            {/* PDF Footer */}
            <div className={styles.pdfFooter}>
              <div className={styles.footerLeft}>
                <div><strong>Radiologist:</strong> {studyData?.radiologist?.name || 'N/A'}</div>
                <div><strong>Date:</strong> {formatDate(new Date().toISOString())}</div>
              </div>
              <div className={styles.footerCenter}>
                <strong>Page {pageIndex + 1} of {dividedContent.length}</strong>
              </div>
              <div className={styles.footerRight}>
                <div>Generated by</div>
                <div><strong>Dentax Imaging System</strong></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

// Simple helper function to divide content into pages
const divideContentIntoPages = (htmlContent: string): string[] => {
  if (!htmlContent || htmlContent.trim() === '') {
    return ['<p>No content available</p>'];
  }

  // Create a temporary DOM element to parse HTML
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = htmlContent;
  
  // Find all major section headings (h1, h2)
  const majorHeadings = Array.from(tempContainer.querySelectorAll('h1, h2'));
  
  // Group content by major sections
  const sections: { heading: HTMLElement | null, content: HTMLElement[] }[] = [];
  
  if (majorHeadings.length === 0) {
    // No major headings - treat all content as one section
    sections.push({
      heading: null,
      content: Array.from(tempContainer.children) as HTMLElement[]
    });
  } else {
    // Process content by sections with headings
    majorHeadings.forEach((heading, index) => {
      const sectionContent: HTMLElement[] = [heading as HTMLElement];
      let currentElement = heading.nextElementSibling;
      
      // Collect all elements until the next major heading
      while (currentElement && 
             (index === majorHeadings.length - 1 || currentElement !== majorHeadings[index + 1])) {
        sectionContent.push(currentElement as HTMLElement);
        currentElement = currentElement.nextElementSibling;
      }
      
      sections.push({
        heading: heading as HTMLElement,
        content: sectionContent
      });
    });
  }
  
  // Now distribute sections across pages
  const pages: string[] = [];
  let currentPageContent: HTMLElement[] = [];
  const maxPageContent = 16; // Adjusted based on A4 page capacity for typical content
  let currentPageSize = 0;
  
  // Function to get a more accurate estimate of content size
  const getContentSize = (elements: HTMLElement[]) => {
    let size = 0;
    elements.forEach(el => {
      // Base size by element type
      const tagName = el.tagName.toLowerCase();
      
      // Calculate size based on element type and content
      if (tagName === 'h1') size += 3;
      else if (tagName === 'h2') size += 2.5;
      else if (tagName === 'h3') size += 2;
      else if (tagName === 'p') {
        // Size based on text length
        const textLength = el.textContent?.length || 0;
        size += 1 + Math.min(textLength / 150, 3);
      }
      else if (tagName === 'table') {
        // Tables take more space
        const rows = el.querySelectorAll('tr').length;
        size += 2 + (rows * 1.2);
      }
      else if (tagName === 'ul' || tagName === 'ol') {
        // Lists based on item count
        const items = el.querySelectorAll('li').length;
        size += 1 + (items * 0.8);
      }
      else if (tagName === 'img') size += 5; // Images take significant space
      else size += 1; // Default size for other elements
      
      // Add for complex nested content
      if (el.children.length > 3) {
        size += (el.children.length - 3) * 0.3;
      }
    });
    return size;
  };
  
  // Process each section
  sections.forEach((section) => {
    const sectionContent = section.content;
    const sectionSize = getContentSize(sectionContent);
    
    // If this section would make the page too full and we already have content,
    // start a new page - but only if the section isn't tiny
    if (currentPageSize > 0 && 
        currentPageSize + sectionSize > maxPageContent && 
        sectionSize > 2) {
      pages.push(createPageContent(currentPageContent));
      currentPageContent = [];
      currentPageSize = 0;
    }
    
    // Special case: If section is very large (more than 80% of a page),
    // consider splitting it further
    if (sectionSize > maxPageContent * 0.8) {
      // Split large sections by subsections or logical breaks
      let subsectionStart = 0;
      
      // First try to split by subsections (h3, h4)
      const subsectionHeadings = sectionContent.reduce((indexes, el, idx) => {
        if ((el.tagName === 'H3' || el.tagName === 'H4') && idx > 0) {
          indexes.push(idx);
        }
        return indexes;
      }, [] as number[]);
      
      // If we have subsection headings, use them to split
      if (subsectionHeadings.length > 0) {
        subsectionHeadings.forEach((headingIndex, idx) => {
          const subsectionContent = sectionContent.slice(subsectionStart, headingIndex);
          const subsectionSize = getContentSize(subsectionContent);
          
          // Check if adding this subsection would overflow the page
          if (currentPageSize + subsectionSize > maxPageContent && currentPageContent.length > 0) {
            // Start new page if it doesn't fit
            pages.push(createPageContent(currentPageContent));
            currentPageContent = [];
            currentPageSize = 0;
          }
          
          // Add subsection to current page
          currentPageContent.push(...subsectionContent);
          currentPageSize += subsectionSize;
          subsectionStart = headingIndex;
          
          // Handle the last subsection
          if (idx === subsectionHeadings.length - 1) {
            const lastSubsection = sectionContent.slice(subsectionStart);
            const lastSubsectionSize = getContentSize(lastSubsection);
            
            // Check if it fits on the current page
            if (currentPageSize + lastSubsectionSize > maxPageContent && currentPageContent.length > 0) {
              pages.push(createPageContent(currentPageContent));
              currentPageContent = [];
              currentPageSize = 0;
            }
            
            currentPageContent.push(...lastSubsection);
            currentPageSize += lastSubsectionSize;
          }
        });
      } else {
        // No subsections - use more generic splitting based on content types
        let currentSubsection: HTMLElement[] = [];
        let currentSubsectionSize = 0;
        
        sectionContent.forEach((element) => {
          const elementSize = getElementSize(element);
          
          // If adding this element would overflow, add current subsection to page
          if (currentSubsectionSize > 0 && 
              currentPageSize + currentSubsectionSize + elementSize > maxPageContent) {
            // Don't split between headings and their immediate next element
            const isHeading = ['H1', 'H2', 'H3', 'H4'].includes(element.tagName);
            const isPreviousHeading = currentSubsection.length > 0 && 
                                    ['H1', 'H2', 'H3', 'H4'].includes(
                                      currentSubsection[currentSubsection.length - 1].tagName
                                    );
            
            if (!isHeading && !isPreviousHeading) {
              // Safe to add current subsection to page
              currentPageContent.push(...currentSubsection);
              currentPageSize += currentSubsectionSize;
              
              // Start a new page if needed
              if (currentPageSize > 0 && currentPageSize + elementSize > maxPageContent) {
                pages.push(createPageContent(currentPageContent));
                currentPageContent = [];
                currentPageSize = 0;
              }
              
              // Reset subsection
              currentSubsection = [element];
              currentSubsectionSize = elementSize;
            } else {
              // Keep heading with its content - add to current subsection
              currentSubsection.push(element);
              currentSubsectionSize += elementSize;
            }
          } else {
            // Element fits in current subsection
            currentSubsection.push(element);
            currentSubsectionSize += elementSize;
          }
        });
        
        // Add the last subsection
        if (currentSubsection.length > 0) {
          // Check if it fits on current page
          if (currentPageSize + currentSubsectionSize > maxPageContent && currentPageContent.length > 0) {
            pages.push(createPageContent(currentPageContent));
            currentPageContent = [];
            currentPageSize = 0;
          }
          
          currentPageContent.push(...currentSubsection);
          currentPageSize += currentSubsectionSize;
        }
      }
    } else {
      // Normal-sized section - add it to the current page
      currentPageContent.push(...sectionContent);
      currentPageSize += sectionSize;
    }
  });
  
  // Add the last page if it has content
  if (currentPageContent.length > 0) {
    pages.push(createPageContent(currentPageContent));
  }
  
  // Ensure we have at least one page
  if (pages.length === 0) {
    pages.push('<p>No content available</p>');
  }
  
  return pages;
};

// Helper function to estimate the "size" of an element for pagination
const getElementSize = (element: HTMLElement): number => {
  const tagName = element.tagName.toLowerCase();
  
  // Assign size values to different element types
  const sizeMap: Record<string, number> = {
    'h1': 2.5,
    'h2': 2,
    'h3': 1.5,
    'h4': 1.2,
    'p': 1,
    'ul': 2,
    'ol': 2,
    'li': 0.8,
    'table': 3,
    'img': 5,
    'blockquote': 2
  };
  
  // Get base size from tag type
  let size = sizeMap[tagName] || 1;
  
  // Adjust size based on content length for text elements
  if (['p', 'h1', 'h2', 'h3', 'h4'].includes(tagName)) {
    const textLength = element.textContent?.length || 0;
    size += Math.min(textLength / 200, 1.5); // Add up to 1.5 size units based on text length
  }
  
  // Tables need special handling
  if (tagName === 'table') {
    const rows = element.querySelectorAll('tr').length;
    const cols = element.querySelector('tr')?.children.length || 0;
    size += (rows * cols) / 4; // Adjust size based on table dimensions
  }
  
  // Lists need special handling based on number of items
  if (tagName === 'ul' || tagName === 'ol') {
    const items = element.querySelectorAll('li').length;
    size += items * 0.5;
  }
  
  return size;
};

// Helper function to convert elements to HTML string
const createPageContent = (elements: HTMLElement[]): string => {
  if (elements.length === 0) return '';
  
  const container = document.createElement('div');
  elements.forEach(el => container.appendChild(el.cloneNode(true)));
  return container.innerHTML;
};

// Removed all the complex page break calculation functions
// Removed all the helper functions for page break logic

  // Export report as PDF
  const exportToPdf = async () => {
    if (!editor || !studyData) {
      toast.error("Missing editor or study data");
      return;
    }
    
    try {
      setExportingPdf(true);
      
      // First ensure we're in preview mode
      if (activeTab !== 'preview') {
        setActiveTab('preview');
        // Wait for rendering to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Create a completely isolated iframe for rendering
      const iframe = document.createElement('iframe');
      iframe.style.width = '800px';
      iframe.style.height = '1130px'; // A4 height ratio
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      // Wait for iframe to be ready
      await new Promise(resolve => {
        iframe.onload = resolve;
        // Force load event
        setTimeout(resolve, 100);
      });
      
      // Get the document inside iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        toast.error("Failed to create export document");
        document.body.removeChild(iframe);
        setExportingPdf(false);
        return;
      }
      
      // Write basic structure with inline styles only (no tailwind or external CSS)
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              background-color: white;
              color: black;
            }
            .page {
              width: 794px;
              min-height: 1123px;
              padding: 40px;
              box-sizing: border-box;
              background-color: white;
              margin: 0 auto;
              position: relative;
              page-break-after: always;
            }
            .header {
              background-color: #0d7d85;
              color: white;
              padding: 15px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .logo {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .logo img {
              height: 40px;
            }
            .logo h2 {
              font-size: 24px;
              margin: 0;
            }
            .title {
              text-align: right;
            }
            .title h3 {
              font-size: 18px;
              margin: 0 0 4px 0;
            }
            .title p {
              font-size: 14px;
              margin: 0;
            }
            .report-header {
              display: flex;
              flex-direction: column;
              gap: 1rem;
              margin-bottom: 1.5rem;
              padding: 1rem;
              background-color: #f9fafb;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .report-title {
              text-align: center;
              border-bottom: 2px solid #0d7d85;
              padding-bottom: 0.5rem;
              margin-bottom: 1rem;
            }
            .report-title h1 {
              color: #0d7d85;
              font-size: 1.8rem;
              font-weight: bold;
              letter-spacing: 0.05em;
              margin: 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1rem;
            }
            .info-section {
              padding: 0.75rem;
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            }
            .info-section h2 {
              font-size: 1.2rem;
              font-weight: 700;
              color: #0d7d85;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 0.5rem;
              margin-top: 0;
              margin-bottom: 0.75rem;
            }
            dl {
              display: grid;
              grid-template-columns: max-content 1fr;
              gap: 0.5rem 1rem;
              margin: 0;
            }
            dt {
              font-weight: 600;
              color: #4b5563;
            }
            dd {
              margin: 0;
              color: #1f2937;
              font-weight: 500;
            }
            .content {
              padding: 10px 0;
            }
            .footer {
              background-color: #f1f5f9;
              padding: 10px 15px;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              font-size: 11pt;
              color: #475569;
              border-top: 1px solid #e2e8f0;
              width: 100%;
              box-sizing: border-box;
              margin-top: auto;
              position: absolute;
              bottom: 40px;
              left: 0;
              right: 0;
            }
            .footer-left {
              text-align: left;
              padding-left: 40px;
            }
            .footer-center {
              text-align: center;
            }
            .footer-right {
              text-align: right;
              padding-right: 40px;
            }
            h1, h2, h3 {
              color: #0d7d85;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1rem 0;
            }
            table th, table td {
              border: 1px solid #d1d5db;
              padding: 8px;
            }
            table th {
              background-color: #f3f4f6;
              font-weight: 600;
            }
            img {
              max-width: 100%;
            }
            p {
              margin: 0.75rem 0;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      // Function to safely escape HTML
      const escapeHTML = (str: string) => {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };
      
      // Get the content to render
      const dividedContent = divideContentIntoPages(editor.getHTML());
      
      // Create and populate pages
      for (let i = 0; i < dividedContent.length; i++) {
        const pageContent = dividedContent[i];
        
        // Create a page container
        const pageDiv = iframeDoc.createElement('div');
        pageDiv.className = 'page';
        
        // Only add header to first page
        if (i === 0) {
          // Add header
          const headerDiv = iframeDoc.createElement('div');
          headerDiv.className = 'header';
          headerDiv.innerHTML = `
            <div class="logo">
              ${logoImage ? `<img src="${logoImage}" alt="Dentax Logo" />` : ''}
              <h2>DENTAX</h2>
            </div>
            <div class="title">
              <h3>RADIOLOGY REPORT</h3>
              <p>Study #${studyData.study_id}</p>
            </div>
          `;
          pageDiv.appendChild(headerDiv);
          
          // Add patient info
          const reportHeaderDiv = iframeDoc.createElement('div');
          reportHeaderDiv.className = 'report-header';
          reportHeaderDiv.innerHTML = `
            <div class="report-title">
              <h1>RADIOLOGY REPORT</h1>
            </div>
            <div class="info-grid">
              <div class="info-section">
                <h2>Patient Information</h2>
                <dl>
                  <dt>Name</dt>
                  <dd><strong>${escapeHTML(studyData?.patient?.name || 'N/A')}</strong></dd>
                  
                  <dt>Patient ID</dt>
                  <dd><strong>${escapeHTML(studyData?.patient_id || 'N/A')}</strong></dd>
                  
                  <dt>Date of Birth</dt>
                  <dd>${escapeHTML(formatDate(studyData?.patient?.date_of_birth))}</dd>
                  
                  <dt>Age</dt>
                  <dd>${escapeHTML(calculateAge(studyData?.patient?.date_of_birth))}</dd>
                  
                  <dt>Gender</dt>
                  <dd>${escapeHTML(studyData?.patient?.gender || 'N/A')}</dd>
                  
                  <dt>Blood Group</dt>
                  <dd>${escapeHTML((studyData?.patient?.blood_group?.toUpperCase() || 'N/A'))}</dd>
                </dl>
              </div>
              <div class="info-section">
                <h2>Study Information</h2>
                <dl>
                  <dt>Study ID</dt>
                  <dd><strong>${escapeHTML(String(studyData?.study_id || 'N/A'))}</strong></dd>
                  
                  <dt>Date</dt>
                  <dd><strong>${escapeHTML(formatDate(studyData?.date))}</strong></dd>
                  
                  <dt>Time</dt>
                  <dd>${escapeHTML(formatTime(studyData?.time))}</dd>
                  
                  <dt>Modality</dt>
                  <dd><strong>${escapeHTML(studyData?.modality || 'N/A')}</strong></dd>
                  
                  <dt>Body Part</dt>
                  <dd><strong>${escapeHTML(studyData?.body_part || 'N/A')}</strong></dd>
                  
                  <dt>Radiologist</dt>
                  <dd><strong>${escapeHTML(studyData?.radiologist?.name || 'N/A')}</strong></dd>
                </dl>
              </div>
            </div>
          `;
          pageDiv.appendChild(reportHeaderDiv);
        }
        
        // Add content
        const contentDiv = iframeDoc.createElement('div');
        contentDiv.className = 'content';
        
        // We need to sanitize the content
        let sanitizedContent = pageContent;
        // Remove any styles that might contain oklch
        sanitizedContent = sanitizedContent.replace(/style="[^"]*oklch\([^"]*"/g, 'style="color:#0d7d85;"');
        // Remove any tailwind classes
        sanitizedContent = sanitizedContent.replace(/class="[^"]*"/g, '');
        
        contentDiv.innerHTML = sanitizedContent;
        pageDiv.appendChild(contentDiv);
        
        // Add footer
        const footerDiv = iframeDoc.createElement('div');
        footerDiv.className = 'footer';
        footerDiv.innerHTML = `
          <div class="footer-left">
            <div><strong>Radiologist:</strong> ${escapeHTML(studyData?.radiologist?.name || 'N/A')}</div>
            <div><strong>Date:</strong> ${escapeHTML(formatDate(new Date().toISOString()))}</div>
          </div>
          <div class="footer-center">
            <strong>Page ${i + 1} of ${dividedContent.length}</strong>
          </div>
          <div class="footer-right">
            <div>Generated by</div>
            <div><strong>Dentax Imaging System</strong></div>
          </div>
        `;
        pageDiv.appendChild(footerDiv);
        
        // Add page to document
        iframeDoc.body.appendChild(pageDiv);
      }
      
      // Create PDF - directly from the iframe content
      try {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Process each page
        const pageElements = iframeDoc.querySelectorAll('.page');
        
        for (let i = 0; i < pageElements.length; i++) {
          const pageElement = pageElements[i] as HTMLElement;
          
          try {
            // Add new page if this isn't the first page
            if (i > 0) {
              pdf.addPage();
            }
            
            // Generate canvas from the page
            const canvas = await html2canvas(pageElement, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff'
            });
            
            // Add to PDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = pageWidth;
            const imgHeight = Math.min(pageHeight, canvas.height * pageWidth / canvas.width);
            
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
            console.log(`Added page ${i+1} to PDF`);
          } catch (err) {
            console.error(`Error processing iframe page ${i+1}:`, err);
          }
        }
        
        // Save the PDF
        const patientName = studyData.patient?.name?.replace(/\s+/g, '_') || 'Patient';
        const currentDate = new Date().toISOString().slice(0,10);
        pdf.save(`Dentax_Report_${patientName}_${studyData.study_id}_${currentDate}.pdf`);
        
        toast.success(`Report exported as PDF with ${pageElements.length} pages`);
      } catch (err) {
        console.error('Error in PDF generation:', err);
        toast.error('PDF generation failed: ' + (err instanceof Error ? err.message : String(err)));
      }
      
      // Clean up
      document.body.removeChild(iframe);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('PDF export failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setExportingPdf(false);
    }
  };

// Helper function to process colors for PDF export
const processColorsForPdf = (element: HTMLElement) => {
  // Create a temporary div for computed style access
  const tempDiv = document.createElement('div');
  document.body.appendChild(tempDiv);
  
  // Replace oklch colors for this element and all descendants
  const processElement = (el: HTMLElement) => {
    // Process styles directly
    try {
      // Copy the element's style
      const computedStyle = getComputedStyle(el);
      const styleProperties = [
        'backgroundColor', 
        'color', 
        'borderColor', 
        'borderLeftColor', 
        'borderRightColor',
        'borderTopColor', 
        'borderBottomColor'
      ];
      
      // Apply computed RGB values directly
      styleProperties.forEach(prop => {
        try {
          const computedValue = computedStyle[prop as any];
          if (computedValue && (computedValue.includes('rgb') || computedValue.includes('#'))) {
            el.style[prop as any] = computedValue;
          }
        } catch (e) {
          // Ignore errors
        }
      });
    } catch (e) {
      // Ignore errors on this element
    }
    
    // Process all children recursively
    Array.from(el.children).forEach(child => {
      if (child instanceof HTMLElement) {
        processElement(child);
      }
    });
  };
  
  // Process the element and its children
  processElement(element);
  
  // Clean up
  document.body.removeChild(tempDiv);
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
                  className={exportingPdf ? "opacity-50" : ""}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  {exportingPdf ? "Exporting..." : "Export as PDF"}
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
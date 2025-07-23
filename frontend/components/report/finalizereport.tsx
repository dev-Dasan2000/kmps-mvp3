const exportFinalizedPdf = async (reportContent: string, signatureUrl: string | null) => {
    if (!studyData) return;
    
    try {
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
        throw new Error("Failed to create export document");
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
              width: calc(100% - 80px);
              box-sizing: border-box;
              margin-top: auto;
              position: absolute;
              bottom: 40px;
              left: 40px;
            }
            .footer-left {
              text-align: left;
            }
            .footer-center {
              text-align: center;
            }
            .footer-right {
              text-align: right;
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
            .signature-section {
              margin-top: 30px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
            }
            .signature-image {
              max-height: 80px;
              max-width: 200px;
              margin-bottom: 10px;
            }
            .signature-text {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .signature-date {
              font-style: italic;
              color: #4b5563;
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
        return String(str || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };
      
      // Get the content to render
      const dividedContent = divideContentIntoPages(reportContent);
      
      // Create and populate pages
      for (let i = 0; i < dividedContent.length; i++) {
        const pageContent = dividedContent[i];
        const isLastPage = i === dividedContent.length - 1;
        
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
        
        // Sanitize the content
        let sanitizedContent = pageContent;
        // Remove any styles that might contain oklch
        sanitizedContent = sanitizedContent.replace(/style="[^"]*oklch\([^"]*"/g, 'style="color:#0d7d85;"');
        // Remove any tailwind classes
        sanitizedContent = sanitizedContent.replace(/class="[^"]*"/g, '');
        
        contentDiv.innerHTML = sanitizedContent;
        pageDiv.appendChild(contentDiv);
        
        // Add signature to the last page
        if (isLastPage) {
          const signatureDiv = iframeDoc.createElement('div');
          signatureDiv.className = 'signature-section';
          
          const currentDate = new Date();
          const formattedDate = formatDate(currentDate.toISOString());
          
          signatureDiv.innerHTML = `
            ${signatureUrl ? `<img src="${signatureUrl}" alt="Radiologist Signature" class="signature-image" />` : ''}
            <div class="signature-text">${escapeHTML(studyData?.radiologist?.name || user?.name || 'Radiologist')}</div>
            <div class="signature-date">${formattedDate}</div>
          `;
          
          contentDiv.appendChild(signatureDiv);
        }
        
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
      
      // Generate and upload PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Process each page
      const pageElements = iframeDoc.querySelectorAll('.page');
      
      for (let i = 0; i < pageElements.length; i++) {
        const pageElement = pageElements[i] as HTMLElement;
        
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
      }
      
      // Convert PDF to blob for upload
      const pdfBlob = pdf.output('blob');
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', pdfBlob, `Report_${studyData.study_id}_${new Date().getTime()}.pdf`);
      
      // Upload file to server
      const uploadResponse = await apiClient.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const fileUrl = uploadResponse.data.url;
      
      // Update report with file URL
      if (reportData?.report_id) {
        await apiClient.put(`/reports/${reportData.report_id}`, {
          report_file_url: fileUrl
        });
      }
      
      // Clean up
      document.body.removeChild(iframe);
      
      return fileUrl;
    } catch (error) {
      console.error('Error exporting finalized PDF:', error);
      throw error;
    }
  };
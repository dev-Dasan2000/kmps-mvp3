import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get all reports
router.get('/',  authenticateToken,  async (req, res) => {
  try {
    const reports = await prisma.reports.findMany({
      include: {
        studies: true
      }
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get report by ID
router.get('/:report_id',  authenticateToken,  async (req, res) => {
  try {
    const report = await prisma.reports.findUnique({
      where: { report_id: parseInt(req.params.report_id) },
      include: {
        studies: {
          include: {
            patient: true,
            radiologist: true
          }
        }
      }
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Get reports by study ID
router.get('/study/:study_id',  authenticateToken,  async (req, res) => {
  try {
    const study = await prisma.study.findUnique({
      where: { study_id: parseInt(req.params.study_id) },
      include: {
        report: true
      }
    });
    
    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }
    
    if (!study.report) {
      return res.json(null);
    }
    
    // Get the full report details
    const report = await prisma.reports.findUnique({
      where: { report_id: study.report_id },
      include: {
        studies: {
          include: {
            patient: true,
            radiologist: true
          }
        }
      }
    });
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report by study ID:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Create a new report
router.post('/',  authenticateToken,  async (req, res) => {
  try {
    const { study_id, status, report_file_url, content } = req.body;

    // Check if study exists
    const study = await prisma.study.findUnique({
      where: { study_id: parseInt(study_id) }
    });
    
    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }

    // Check if report already exists for this study
    if (study.report_id) {
      return res.status(400).json({ error: 'A report already exists for this study' });
    }

    // Prepare data for report creation
    const reportData = {
      status,
      report_file_url,
      content,
      finalized_at: status === 'finalized' ? new Date() : null,
      studies: {
        connect: { study_id: parseInt(study_id) }
      }
    };

    // Create the report
    const newReport = await prisma.reports.create({
      data: reportData,
      include: {
        studies: true
      }
    });

    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Update a report
router.put('/:report_id',  authenticateToken,  async (req, res) => {
  try {
    const reportId = parseInt(req.params.report_id);
    const { status, report_file_url, content } = req.body;

    // Check if report exists
    const existingReport = await prisma.reports.findUnique({
      where: { report_id: reportId }
    });
    
    if (!existingReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if report is being finalized
    const isBeingFinalized = status === 'finalized' && existingReport.status !== 'finalized';

    // Update the report
    const updatedReport = await prisma.reports.update({
      where: { report_id: reportId },
      data: {
        status: status ?? existingReport.status,
        report_file_url: report_file_url ?? existingReport.report_file_url,
        content: content ?? existingReport.content,
        updated_at: new Date().toISOString(),
        finalized_at: isBeingFinalized ? new Date() : existingReport.finalized_at
      }
    });

    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Delete a report
router.delete('/:report_id',  authenticateToken,  async (req, res) => {
  try {
    const reportId = parseInt(req.params.report_id);

    // Check if report exists
    const existingReport = await prisma.reports.findUnique({
      where: { report_id: reportId }
    });
    
    if (!existingReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // First, update the study to remove the report reference
    await prisma.study.updateMany({
      where: { report_id: reportId },
      data: { report_id: null }
    });

    // Then delete the report
    await prisma.reports.delete({
      where: { report_id: reportId }
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Export a report to PDF
router.post('/export/:report_id',  authenticateToken,  async (req, res) => {
  try {
    const reportId = parseInt(req.params.report_id);
    const { html_content } = req.body;

    // Check if report exists
    const existingReport = await prisma.reports.findUnique({
      where: { report_id: reportId }
    });
    
    if (!existingReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Here PDF generation on the server if needed
    // For now we'll just update the report content and file URL

    const fileName = `report_${reportId}_${new Date().toISOString().slice(0,10)}.pdf`;
    const report_file_url = `/reports/${fileName}`;

    // Update the report with PDF information
    await prisma.reports.update({
      where: { report_id: reportId },
      data: {
        content: html_content,
        report_file_url
      }
    });

    res.json({ success: true, file_url: report_file_url });
  } catch (error) {
    console.error('Error exporting report as PDF:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

export default router;
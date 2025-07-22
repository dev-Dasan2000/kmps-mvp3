import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const router = express.Router();
const prisma = new PrismaClient();

const notesRouter = (io) => {
    const router = express.Router();

    router.get('/', /*authenticateToken,*/ async (req, res) => {
        try {
            const notes = await prisma.note.findMany({
                include: {
                    dentist: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    radiologist: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            });
            res.json(notes);
        } catch (error) {
            console.error('Error fetching notes:', error);
            res.status(500).json({ error: 'Failed to fetch notes' });
        }
    });

    // Get note by ID
    router.get('/:note_id', /*authenticateToken,*/ async (req, res) => {
        try {
            const note_id = Number(req.params.note_id);

            const note = await prisma.note.findUnique({
                where: { note_id },
                include: {
                    dentist: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    radiologist: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            });

            if (!note) {
                return res.status(404).json({ error: 'Note not found' });
            }

            res.json(note);
        } catch (error) {
            console.error('Error fetching note:', error);
            res.status(500).json({ error: 'Failed to fetch note' });
        }
    });

    // Create a new note
    router.post('/', /*authenticateToken,*/ async (req, res) => {
        try {
            const { note, dentist_id, radiologist_id } = req.body;

            if (!note) {
                return res.status(400).json({ error: 'Note content is required' });
            }

            // Ensure at least one of dentist_id or radiologist_id is provided
            if (!dentist_id && !radiologist_id) {
                return res.status(400).json({ error: 'Either dentist_id or radiologist_id must be provided' });
            }

            // If dentist_id is provided, verify it exists
            if (dentist_id) {
                const dentist = await prisma.dentists.findUnique({
                    where: { dentist_id }
                });
                if (!dentist) {
                    return res.status(404).json({ error: 'Dentist not found' });
                }
            }

            // If radiologist_id is provided, verify it exists
            if (radiologist_id) {
                const radiologist = await prisma.radiologists.findUnique({
                    where: { radiologist_id }
                });
                if (!radiologist) {
                    return res.status(404).json({ error: 'Radiologist not found' });
                }
            }

            const newNote = await prisma.note.create({
                data: {
                    note,
                    dentist_id,
                    radiologist_id
                }
            });
            io.emit('note_created', newNote);
            res.status(201).json(newNote);
        } catch (error) {
            console.error('Error creating note:', error);
            res.status(500).json({ error: 'Failed to create note' });
        }
    });

    // Update a note
    router.put('/:note_id', /*authenticateToken,*/ async (req, res) => {
        try {
            const note_id = Number(req.params.note_id);
            const { note, dentist_id, radiologist_id } = req.body;

            // Check if note exists
            const existingNote = await prisma.note.findUnique({
                where: { note_id }
            });

            if (!existingNote) {
                return res.status(404).json({ error: 'Note not found' });
            }

            // Update the note
            const updatedNote = await prisma.note.update({
                where: { note_id },
                data: {
                    note: note !== undefined ? note : existingNote.note,
                    dentist_id: dentist_id !== undefined ? dentist_id : existingNote.dentist_id,
                    radiologist_id: radiologist_id !== undefined ? radiologist_id : existingNote.radiologist_id
                    // We don't update created_at as it represents when the note was first created
                }
            });
            io.emit('note_updated', updatedNote);
            res.json(updatedNote);
        } catch (error) {
            console.error('Error updating note:', error);
            res.status(500).json({ error: 'Failed to update note' });
        }
    });

    // Delete a note
    router.delete('/:note_id', /*authenticateToken,*/ async (req, res) => {
        try {
            const note_id = Number(req.params.note_id);

            // Check if note exists
            const existingNote = await prisma.note.findUnique({
                where: { note_id }
            });

            if (!existingNote) {
                return res.status(404).json({ error: 'Note not found' });
            }

            // Delete the note
            await prisma.note.delete({
                where: { note_id }
            });
            io.emit('note_deleted', { note_id }); 
            res.json({ message: 'Note deleted successfully' });
        } catch (error) {
            console.error('Error deleting note:', error);
            res.status(500).json({ error: 'Failed to delete note' });
        }
    });
    return router;
}

export default notesRouter;
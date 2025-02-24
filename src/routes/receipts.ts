import { Router, Request, Response, RequestHandler } from 'express';
import { processReceipt, getReceiptPoints } from '../services/receipt-service';
import { Receipt } from '../models/types';

const router = Router();

// POST /receipts/process
const processReceiptHandler: RequestHandler = (req, res) => {
  try {
    const receipt = req.body as Receipt;
    
    // Basic validation
    if (!validateReceipt(receipt)) {
      res.status(400).json({ error: 'Invalid receipt. Please verify input.' });
      return;
    }
    
    const id = processReceipt(receipt);
    res.status(200).json({ id });
  } catch (error) {
    console.error('Error processing receipt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /receipts/:id/points
const getPointsHandler: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const points = getReceiptPoints(id);
    
    if (points === null) {
      res.status(404).json({ error: 'No receipt found for that ID.' });
      return;
    }
    
    res.status(200).json({ points });
  } catch (error) {
    console.error('Error getting receipt points:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.post('/process', processReceiptHandler);
router.get('/:id/points', getPointsHandler);

// Basic receipt validation
function validateReceipt(receipt: any): receipt is Receipt {
  if (!receipt) return false;
  
  // Check required fields
  if (!receipt.retailer || typeof receipt.retailer !== 'string') return false;
  if (!receipt.purchaseDate) return false;
  if (!receipt.purchaseTime) return false;
  if (!receipt.total) return false;
  if (!Array.isArray(receipt.items) || receipt.items.length === 0) return false;
  
  // Validate items
  for (const item of receipt.items) {
    if (!item.shortDescription || !item.price) return false;
  }
  
  // Validate formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
  const timeRegex = /^\d{2}:\d{2}$/; // HH:MM
  const priceRegex = /^\d+\.\d{2}$/; // X.XX
  
  if (!dateRegex.test(receipt.purchaseDate)) return false;
  if (!timeRegex.test(receipt.purchaseTime)) return false;
  if (!priceRegex.test(receipt.total)) return false;
  
  return true;
}

export default router;

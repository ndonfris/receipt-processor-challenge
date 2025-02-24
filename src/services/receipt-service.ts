import { v4 as uuidv4 } from 'uuid';
import { Receipt, ReceiptEntry } from '../models/types';

/**
 * Rules:
 *  1.) One point for every alphanumeric character in the retailer name
 *  2.) 50 points if the total is a round dollar amount with no cents
 *  3.) 25 points if the total is a multiple of 0.25
 *  4.) 5 points for every two items on the receipt
 *  5.) If the trimmed length of the item description is a multiple of 3, multiply the price by 0.2 and round up to the nearest integer. Add that to the total points.
 *  ?.) I assume this rule is to be skipped, looks like it checks for LLM usage
 *  6.) 6 points if the day in the purchase date is odd
 *  7.) 10 points if the time of purchase is after 2:00pm and before 4:00pm
 */

// In-memory storage for receipts
const receiptsStore: Record<string, ReceiptEntry> = {};

export const processReceipt = (receipt: Receipt): string => {
  const id = uuidv4();
  const points = calculatePoints(receipt);

  receiptsStore[id] = {
    ...receipt,
    id,
    points
  };

  return id;
};

export const getReceiptPoints = (id: string): number | null => {
  const receipt = receiptsStore[id];
  return receipt ? receipt.points : null;
};

const calculatePoints = (receipt: Receipt): number => {
  let points = 0;

  // Rule 1: One point for every alphanumeric character in the retailer name
  points += receipt.retailer.replace(/[^a-zA-Z0-9]/g, '').length;

  // Rule 2: 50 points if the total is a round dollar amount with no cents
  if (parseFloat(receipt.total).toFixed(2).endsWith('.00')) {
    points += 50;
  }

  // Rule 3: 25 points if the total is a multiple of 0.25
  if (parseFloat(receipt.total) % 0.25 === 0) {
    points += 25;
  }

  // Rule 4: 5 points for every two items on the receipt
  points += Math.floor(receipt.items.length / 2) * 5;


  // Rule 5: If the trimmed length of the item description is a multiple of 3,
  // multiply the price by 0.2 and round up to the nearest integer
  receipt.items.forEach(item => {
    const trimmedLength = item.shortDescription.trim().length;
    if (trimmedLength % 3 === 0 && trimmedLength !== 0) {
      points += Math.ceil(parseFloat(item.price) * 0.2);
    }
  });

  // Rule 6: 6 points if the day in the purchase date is odd
  const purchaseDay = new Date(receipt.purchaseDate).getDay();
  if (purchaseDay % 2 === 1) {
    points += 6;
  }

  // Rule 7: 10 points if the time of purchase is after 2:00pm and before 4:00pm
  const [hours, minutes] = receipt.purchaseTime.split(':').map(Number);
  if ((hours === 14 && minutes > 0) || (hours === 15) || (hours === 16 && minutes === 0)) {
    points += 10;
  }

  return points;
};


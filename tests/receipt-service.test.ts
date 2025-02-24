import { processReceipt, getReceiptPoints } from '../src/services/receipt-service';
import { Receipt } from '../src/models/types';

describe('Receipt Service', () => {
  // Sample receipt data for testing
  const targetReceipt: Receipt = {
    retailer: 'Target',
    purchaseDate: '2022-01-01',
    purchaseTime: '13:01',
    items: [
      { shortDescription: 'Mountain Dew 12PK', price: '6.49' },
      { shortDescription: 'Emils Cheese Pizza', price: '12.25' },
      { shortDescription: 'Knorr Creamy Chicken', price: '1.26' },
      { shortDescription: 'Doritos Nacho Cheese', price: '3.35' },
      { shortDescription: '   Klarbrunn 12-PK 12 FL OZ  ', price: '12.00' }
    ],
    total: '35.35'
  };

  const cornerMarketReceipt: Receipt = {
    retailer: 'M&M Corner Market',
    purchaseDate: '2022-03-20',
    purchaseTime: '14:33',
    items: [
      { shortDescription: 'Gatorade', price: '2.25' },
      { shortDescription: 'Gatorade', price: '2.25' },
      { shortDescription: 'Gatorade', price: '2.25' },
      { shortDescription: 'Gatorade', price: '2.25' }
    ],
    total: '9.00'
  };

  describe('processReceipt', () => {
    it('should process a receipt and return an ID', () => {
      const id = processReceipt(targetReceipt);
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('getReceiptPoints', () => {
    it('should return null for a non-existent receipt ID', () => {
      const points = getReceiptPoints('non-existent-id');
      expect(points).toBeNull();
    });

    it('should calculate correct points for the Target receipt example', () => {
      const id = processReceipt(targetReceipt);
      const points = getReceiptPoints(id);
      
      // From README example:
      // 6 points - retailer name has 6 characters
      // 10 points - 5 items (2 pairs @ 5 points each)
      // 3 Points - "Emils Cheese Pizza" is 18 characters (a multiple of 3)
      //           item price of 12.25 * 0.2 = 2.45, rounded up is 3 points
      // 3 Points - "Klarbrunn 12-PK 12 FL OZ" is 24 characters (a multiple of 3)
      //           item price of 12.00 * 0.2 = 2.4, rounded up is 3 points
      // 6 points - purchase day is odd
      // + ---------
      // = 28 points
      expect(points).toBe(28);
    });

    it('should calculate correct points for the Corner Market receipt example', () => {
      const id = processReceipt(cornerMarketReceipt);
      const points = getReceiptPoints(id);
      
      // From README example:
      // 50 points - total is a round dollar amount
      // 25 points - total is a multiple of 0.25
      // 14 points - retailer name (M&M Corner Market) has 14 alphanumeric characters
      //             note: '&' is not alphanumeric
      // 10 points - 2:33pm is between 2:00pm and 4:00pm
      // 10 points - 4 items (2 pairs @ 5 points each)
      // + ---------
      // = 109 points
      expect(points).toBe(109);
    });
  });

  // Add more specific tests for individual point-calculation rules
  describe('specific point calculation rules', () => {
    it('should award one point for each alphanumeric character in retailer name', () => {
      // Test with different retailer names
      const receipt1 = { ...targetReceipt, retailer: 'ABC' };
      const receipt2 = { ...targetReceipt, retailer: 'A&B-CD' };
      
      const id1 = processReceipt(receipt1);
      const id2 = processReceipt(receipt2);
      
      // Points should be different based on retailer name length
      // Retailer point difference should be retailer name alphanumeric char difference
      const points1 = getReceiptPoints(id1);
      const points2 = getReceiptPoints(id2);
      
      // ABC has 3 alphanumeric chars, A&B-CD has 4
      // So points2 - points1 should be 1 if all other rules remain the same
      expect(points2! - points1!).toBe(1);
    });

    it('should award 50 points if the total is a round dollar amount', () => {
      const roundTotalReceipt = { 
        ...targetReceipt, 
        total: '35.00' 
      };
      
      const nonRoundTotalReceipt = {
        ...targetReceipt,
        total: '35.25'
      };
      
      const id1 = processReceipt(roundTotalReceipt);
      const id2 = processReceipt(nonRoundTotalReceipt);

      const points1 = getReceiptPoints(id1);
      const points2 = getReceiptPoints(id2);

      // The round total receipt should have 50 more points
      expect(points1! - points2!).toBe(50);
    });

    it('should award 25 points if the total is a multiple of 0.25', () => {
      const multipleOf25Receipt = {
        ...targetReceipt,
        total: '35.50'
      };
      
      const notMultipleOf25Receipt = {
        ...targetReceipt,
        total: '35.37'
      };
      
      const id1 = processReceipt(multipleOf25Receipt);
      const id2 = processReceipt(notMultipleOf25Receipt);
      
      const points1 = getReceiptPoints(id1);
      const points2 = getReceiptPoints(id2);
      
      // The multiple of 0.25 receipt should have 25 more points
      expect(points1! - points2!).toBe(25);
    });

    it('should award 6 points if the day is odd', () => {
      const oddDayReceipt = {
        ...targetReceipt,
        purchaseDate: '2022-01-01' // 1st - odd
      };
      
      const evenDayReceipt = {
        ...targetReceipt,
        purchaseDate: '2022-01-02' // 2nd - even
      };
      
      const id1 = processReceipt(oddDayReceipt);
      const id2 = processReceipt(evenDayReceipt);
      
      const points1 = getReceiptPoints(id1);
      const points2 = getReceiptPoints(id2);
      
      // The odd day receipt should have 6 more points
      expect(points1! - points2!).toBe(6);
    });

    it('should award 10 points if purchase time is between 2pm and 4pm', () => {
      const beforeTwoReceipt = {
        ...targetReceipt,
        purchaseTime: '13:59' // 1:59 PM
      };
      
      const betweenTwoAndFourReceipt = {
        ...targetReceipt,
        purchaseTime: '14:30' // 2:30 PM
      };
      
      const afterFourReceipt = {
        ...targetReceipt,
        purchaseTime: '16:01' // 4:01 PM
      };
      
      const id1 = processReceipt(beforeTwoReceipt);
      const id2 = processReceipt(betweenTwoAndFourReceipt);
      const id3 = processReceipt(afterFourReceipt);
      
      const points1 = getReceiptPoints(id1);
      const points2 = getReceiptPoints(id2);
      const points3 = getReceiptPoints(id3);
      
      // The receipt between 2 and 4 should have 10 more points
      expect(points2! - points1!).toBe(10);
      expect(points2! - points3!).toBe(10);
    });
  });
});

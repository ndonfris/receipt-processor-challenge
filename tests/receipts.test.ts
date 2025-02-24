import * as supertest from 'supertest';
import app from '../src/app';
import { Receipt } from '../src/models/types';
// import { calculatePointsVerbose } from '../src/services/receipt-service';

describe('Receipt Routes', () => {
  const validReceipt: Receipt = {
    retailer: 'Target',
    purchaseDate: '2022-01-01',
    purchaseTime: '13:01',
    items: [
      { shortDescription: 'Mountain Dew 12PK', price: '6.49' },
      { shortDescription: 'Emils Cheese Pizza', price: '12.25' }
    ],
    total: '18.74'
  };

  describe('POST /receipts/process', () => {
    it('should process a valid receipt and return an ID', async () => {
      const response = await supertest.default(app)
        .post('/receipts/process')
        .send(validReceipt)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(typeof response.body.id).toBe('string');
      expect(response.body.id.length).toBeGreaterThan(0);
    });

    it('should return 400 for an invalid receipt', async () => {
      const invalidReceipt = {
        retailer: 'Target',
        // Missing required fields
        items: []
      };

      const response = await supertest.default(app)
        .post('/receipts/process')
        .send(invalidReceipt)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid receipt');
    });

    it('should validate receipt format correctly', async () => {
      const invalidDateReceipt = {
        ...validReceipt,
        purchaseDate: '01/01/2022' // Wrong format
      };

      await supertest.default(app)
        .post('/receipts/process')
        .send(invalidDateReceipt)
        .expect(400);

      const invalidTimeReceipt = {
        ...validReceipt,
        purchaseTime: '1:01 PM' // Wrong format
      };

      await supertest.default(app)
        .post('/receipts/process')
        .send(invalidTimeReceipt)
        .expect(400);

      const invalidTotalReceipt = {
        ...validReceipt,
        total: '18.7' // Wrong format
      };

      await supertest.default(app)
        .post('/receipts/process')
        .send(invalidTotalReceipt)
        .expect(400);
    });
  });

  describe('GET /receipts/:id/points', () => {
    it('should return points for a valid receipt ID', async () => {
      // First process a receipt to get a valid ID
      const processResponse = await supertest.default(app)
        .post('/receipts/process')
        .send(validReceipt)
        .expect(200);

      const { id } = processResponse.body;

      // Then get the points for that ID
      const pointsResponse = await supertest.default(app)
        .get(`/receipts/${id}/points`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(pointsResponse.body).toHaveProperty('points');
      expect(typeof pointsResponse.body.points).toBe('number');
    });

    it('should return 404 for a non-existent receipt ID', async () => {
      const response = await supertest.default(app)
        .get('/receipts/non-existent-id/points')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No receipt found');
    });
  });

  // Integration test for the complete flow
  describe('Complete receipt processing flow', () => {
    it('should calculate the correct points for the Simple Receipt example receipt', async () => {
      const cornerMarketExampleReceipt: Receipt = {
        retailer: "Target",
        purchaseDate: "2022-01-02",
        purchaseTime: "13:13",
        total: "1.25",
        items: [
          {
            shortDescription: "Pepsi - 12-oz",
            price: "1.25",
          }
        ]
      };

      // Process the receipt
      const processResponse = await supertest.default(app)
        .post('/receipts/process')
        .send(cornerMarketExampleReceipt)
        .expect(200);

      const { id } = processResponse.body;

      // Get the points
      const pointsResponse = await supertest.default(app)
        .get(`/receipts/${id}/points`)
        .expect(200);

      // Check the points match the expected value
      expect(pointsResponse.body.points).toBe(31);
    });

    it('should calculate the correct points for the Corner Market example receipt', async () => {
      const cornerMarketExampleReceipt: Receipt = {
        retailer: "M&M Corner Market",
        purchaseDate: "2022-03-20",
        purchaseTime: "14:33",
        items: [
          {
            shortDescription: "Gatorade",
            price: "2.25"
          },{
            shortDescription: "Gatorade",
            price: "2.25"
          },{
            shortDescription: "Gatorade",
            price: "2.25"
          },{
            shortDescription: "Gatorade",
            price: "2.25"
          }
        ],
        total: "9.00"
      };

      // Process the receipt
      const processResponse = await supertest.default(app)
        .post('/receipts/process')
        .send(cornerMarketExampleReceipt)
        .expect(200);

      const { id } = processResponse.body;

      // Get the points
      const pointsResponse = await supertest.default(app)
        .get(`/receipts/${id}/points`)
        .expect(200);

      // Check the points match the expected value
      expect(pointsResponse.body.points).toBe(109);
    })

    it('should calculate the correct points for the Target example receipt', async () => {
      const targetExampleReceipt: Receipt = {
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

      // Process the receipt
      const processResponse = await supertest.default(app)
        .post('/receipts/process')
        .send(targetExampleReceipt)
        .expect(200);

      const { id } = processResponse.body;

      // Get the points
      const pointsResponse = await supertest.default(app)
        .get(`/receipts/${id}/points`)
        .expect(200);

      expect(pointsResponse.body.points).toBe(28);
    });
    
  });
});

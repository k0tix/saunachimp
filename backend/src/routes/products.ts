import { Request, Response, Router } from 'express';
import { query } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

interface Product extends RowDataPacket {
  id: number;
  name: string;
  description: string;
  price: number;
  created_at: Date;
  item_type: string;
  asset_url: string;
}

// GET all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await query('SELECT * FROM products') as Product[];
    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET single product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const products = await query('SELECT * FROM products WHERE id = ?', [id]) as Product[];
    
    if (products.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      data: products[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});


export default router;


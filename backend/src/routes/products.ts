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
}

// GET all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY created_at DESC') as Product[];
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

// POST create new product
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, price } = req.body;

    if (!name || !price) {
      res.status(400).json({
        success: false,
        message: 'Name and price are required',
      });
      return;
    }

    const result = await query(
      'INSERT INTO products (name, description, price) VALUES (?, ?, ?)',
      [name, description || '', price]
    ) as ResultSetHeader;

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: result.insertId,
        name,
        description,
        price,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT update product
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;

    if (!name && !description && !price) {
      res.status(400).json({
        success: false,
        message: 'At least one field (name, description, or price) is required',
      });
      return;
    }

    const result = await query(
      'UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description), price = COALESCE(?, price) WHERE id = ?',
      [name, description, price, id]
    ) as ResultSetHeader;

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM products WHERE id = ?', [id]) as ResultSetHeader;

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;


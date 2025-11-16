import { Request, Response, Router } from 'express';
import { query } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

interface OwnedProduct extends RowDataPacket {
  id: number;
  product_id: number;
  user_id: string;
  purchase_date: Date;
  in_use: number;
  product_name?: string;
  product_description?: string;
  product_price?: number;
  product_type?: string;
  asset_url?: string;
}

// POST purchase a product
router.post('/purchase/:user_id/:product_id', async (req: Request, res: Response) => {
  try {
    const { user_id, product_id } = req.params;

    // Check if product exists
    const products = await query('SELECT * FROM products WHERE id = ?', [product_id]) as RowDataPacket[];
    
    if (products.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    const product = products[0];
    const productPrice = parseInt(product.price);

    // Check if user exists and get their money
    const users = await query('SELECT * FROM users WHERE id = ?', [user_id]) as RowDataPacket[];
    
    if (users.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const user = users[0];
    const userMoney = parseInt(user.money);

    // Check if user has enough money
    if (userMoney < productPrice) {
      res.status(400).json({
        success: false,
        message: 'Insufficient funds',
        data: {
          required: productPrice,
          available: userMoney,
          shortfall: productPrice - userMoney,
        },
      });
      return;
    }
    // check if product is already owned
    // Deduct money from user
    const newBalance = userMoney - productPrice;
    await query('UPDATE users SET money = ? WHERE id = ?', [newBalance, user_id]);

    // Add to owned products
    const result = await query(
      'INSERT INTO owned_products (product_id, user_id) VALUES (?, ?)',
      [product_id, user_id]
    ) as ResultSetHeader;

    res.status(201).json({
      success: true,
      message: 'Product purchased successfully',
      data: {
        id: result.insertId,
        product_id,
        user_id,
        product: product,
        transaction: {
          price_paid: productPrice,
          previous_balance: userMoney,
          new_balance: newBalance,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error purchasing product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET all owned products for a user
router.get('/user/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const ownedProducts = await query(
      `SELECT op.*, p.name as product_name, p.description as product_description, 
              p.price as product_price, p.item_type as product_type, p.asset_url
       FROM owned_products op
       JOIN products p ON op.product_id = p.id
       WHERE op.user_id = ?
       ORDER BY op.purchase_date DESC`,
      [user_id]
    ) as OwnedProduct[];

    res.json({
      success: true,
      data: ownedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching owned products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT toggle in_use status
router.put('/:id/toggle-use', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get owned product with product details
    const owned = await query(
      `SELECT op.*, p.item_type as product_type
       FROM owned_products op
       JOIN products p ON op.product_id = p.id
       WHERE op.product_id = ?`,
      [id]
    ) as OwnedProduct[];

    if (owned.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Owned product not found',
      });
      return;
    }

    const currentProduct = owned[0];
    const newStatus = currentProduct.in_use === 1 ? 0 : 1;

    // If enabling this item, disable all other items of the same type for this user
    if (newStatus === 1) {
      await query(
        `UPDATE owned_products op
         JOIN products p ON op.product_id = p.id
         SET op.in_use = 0
         WHERE op.user_id = ? AND p.item_type = ? AND op.product_id != ?`,
        [currentProduct.user_id, currentProduct.product_type, id]
      );
    }
    // Update the current item
    await query('UPDATE owned_products SET in_use = ? WHERE product_id = ?', [newStatus, id]);
    res.json({
      success: true,
      message: `Product marked as ${newStatus === 1 ? 'in use' : 'not in use'}`,
      data: {
        id: parseInt(id),
        in_use: newStatus,
        item_type: currentProduct.product_type,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling product status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE remove owned product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM owned_products WHERE id = ?', [id]) as ResultSetHeader;

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'Owned product not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Owned product removed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing owned product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;


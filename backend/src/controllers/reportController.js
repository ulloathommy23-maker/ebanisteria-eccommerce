const db = require('../utils/db');

exports.getOrdersReport = async (req, res) => {
    try {
        const { start_date, end_date, status } = req.query;

        let query = `
            SELECT o.*, c.full_name as customer_name
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
        `;
        let params = [];
        let whereClauses = [];

        if (start_date) {
            params.push(start_date);
            whereClauses.push(`o.created_at >= $${params.length}`);
        }
        if (end_date) {
            params.push(end_date);
            whereClauses.push(`o.created_at <= $${params.length}`);
        }
        if (status) {
            params.push(status);
            whereClauses.push(`o.status = $${params.length}`);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ' ORDER BY o.created_at DESC';

        const result = await db.query(query, params);

        // Calculate summary stats
        const totalOrders = result.rows.length;
        const totalValue = result.rows.reduce((sum, order) => sum + parseFloat(order.agreed_price), 0);

        const byStatus = result.rows.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                orders: result.rows,
                summary: {
                    total_orders: totalOrders,
                    total_value: totalValue,
                    by_status: byStatus
                }
            }
        });

    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

exports.getInventoryReport = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_items,
                SUM(current_stock * COALESCE(unit_cost, 0)) as total_value,
                COUNT(*) FILTER (WHERE current_stock <= min_stock_alert) as low_stock_items
            FROM materials
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
};


exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Order Stats
        const orderStatsResult = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'delivered') as delivered
            FROM orders
        `);
        const orderStats = orderStatsResult.rows[0];

        // 2. Low Stock Stats
        const lowStockResult = await db.query(`
            SELECT COUNT(*) as count FROM materials WHERE current_stock <= min_stock_alert
        `);
        const lowStockCount = lowStockResult.rows[0].count;

        // 3. Total Customers
        const customerResult = await db.query(`SELECT COUNT(*) as count FROM customers`);
        const totalCustomers = customerResult.rows[0].count;

        // 4. Recent Orders (Top 5)
        const recentOrdersResult = await db.query(`
            SELECT o.id, o.order_number, o.status, o.agreed_price, o.created_at, c.full_name as customer_name
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `);

        // 5. Upcoming Deliveries (Next 7 days)
        const upcomingDeliveriesResult = await db.query(`
            SELECT o.id, o.order_number, o.estimated_delivery, o.status, c.full_name as customer_name
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.estimated_delivery >= CURRENT_DATE 
            AND o.estimated_delivery <= CURRENT_DATE + INTERVAL '7 days'
            AND o.status NOT IN ('completed', 'delivered')
            ORDER BY o.estimated_delivery ASC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                stats: {
                    ...orderStats,
                    low_stock: lowStockCount,
                    total_customers: totalCustomers
                },
                recent_orders: recentOrdersResult.rows,
                upcoming_deliveries: upcomingDeliveriesResult.rows
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

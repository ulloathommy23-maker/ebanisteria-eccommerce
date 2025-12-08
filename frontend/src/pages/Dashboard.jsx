import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Clock, CheckCircle, AlertTriangle, Package } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState({
        stats: { pending: 0, in_progress: 0, completed: 0, delivered: 0, low_stock: 0 },
        recent_orders: [],
        upcoming_deliveries: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/reports/dashboard');
                setDashboardData(response.data.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: `${color}20`, color: color }}>
                <Icon size={24} />
            </div>
            <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#666' }}>{title}</h3>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>{value}</p>
            </div>
        </div>
    );

    const SectionHeader = ({ title }) => (
        <h2 style={{ fontSize: '1.2rem', margin: '30px 0 15px', color: '#333', borderBottom: '2px solid #8B4513', paddingBottom: '10px', display: 'inline-block' }}>{title}</h2>
    );

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ marginBottom: '20px', color: '#333' }}>Dashboard</h1>
            <p style={{ marginBottom: '30px', color: '#666' }}>Welcome back, <strong>{user?.full_name}</strong>!</p>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <StatCard title="Pending Orders" value={dashboardData.stats.pending} icon={Clock} color="#FF9800" />
                <StatCard title="In Progress" value={dashboardData.stats.in_progress} icon={Package} color="#2196F3" />
                <StatCard title="Completed" value={dashboardData.stats.completed} icon={CheckCircle} color="#4CAF50" />
                <StatCard title="Low Stock Materials" value={dashboardData.stats.low_stock} icon={AlertTriangle} color="#F44336" />
            </div>

            {/* Main Content Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginTop: '20px' }}>

                {/* Recent Orders */}
                <div>
                    <SectionHeader title="Recent Orders" />
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
                        {dashboardData.recent_orders.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.9rem', color: '#666' }}>Order #</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.9rem', color: '#666' }}>Customer</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.9rem', color: '#666' }}>Status</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.9rem', color: '#666' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.recent_orders.map((order, i) => (
                                        <tr key={order.id} style={{ borderBottom: i < dashboardData.recent_orders.length - 1 ? '1px solid #eee' : 'none' }}>
                                            <td style={{ padding: '12px', fontWeight: '500' }}>#{order.order_number}</td>
                                            <td style={{ padding: '12px' }}>{order.customer_name}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    backgroundColor:
                                                        order.status === 'completed' ? '#E8F5E8' :
                                                            order.status === 'in_progress' ? '#E3F2FD' :
                                                                order.status === 'delivered' ? '#F3E5F5' : '#FFF3E0',
                                                    color:
                                                        order.status === 'completed' ? '#2E7D32' :
                                                            order.status === 'in_progress' ? '#1565C0' :
                                                                order.status === 'delivered' ? '#7B1FA2' : '#E65100'
                                                }}>
                                                    {order.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>${order.agreed_price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ padding: '20px', textAlign: 'center', color: '#999', margin: 0 }}>No recent orders</p>
                        )}
                    </div>
                </div>

                {/* Upcoming Deliveries */}
                <div>
                    <SectionHeader title="Upcoming Deliveries (7 Days)" />
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
                        {dashboardData.upcoming_deliveries.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {dashboardData.upcoming_deliveries.map((delivery, i) => (
                                    <div key={delivery.id} style={{
                                        padding: '15px',
                                        borderBottom: i < dashboardData.upcoming_deliveries.length - 1 ? '1px solid #eee' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            backgroundColor: '#FFF3E0',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            color: '#E65100',
                                            minWidth: '60px'
                                        }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                {new Date(delivery.estimated_delivery).toLocaleString('default', { month: 'short' }).toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                {new Date(delivery.estimated_delivery).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333' }}>#{delivery.order_number} - {delivery.customer_name}</p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Status: {delivery.status.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ padding: '20px', textAlign: 'center', color: '#999', margin: 0 }}>No upcoming deliveries</p>
                        )}
                    </div>
                </div>

            </div>

            <div style={{ marginTop: '40px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <a href="/customers" style={{ textDecoration: 'none', backgroundColor: '#8B4513', color: 'white', padding: '10px 20px', borderRadius: '4px' }}>Manage Customers</a>
                    <a href="/orders" style={{ textDecoration: 'none', backgroundColor: '#D2691E', color: 'white', padding: '10px 20px', borderRadius: '4px' }}>Create Order</a>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

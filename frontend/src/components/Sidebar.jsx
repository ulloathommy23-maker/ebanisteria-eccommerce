import { Link, useLocation } from 'react-router-dom';
import { Home, Users, ClipboardList, Hammer, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen }) => {
    const location = useLocation();
    const { user } = useAuth();

    // Mobile responsiveness logic could happen here, but for now we trust isOpen prop

    const menuItems = [
        { path: '/', label: 'Panel Principal', icon: <Home size={20} /> },
        { path: '/customers', label: 'Clientes', icon: <Users size={20} /> },
        { path: '/orders', label: 'Pedidos', icon: <ClipboardList size={20} /> },
        { path: '/materials', label: 'Materiales', icon: <Hammer size={20} /> },
        { path: '/reports', label: 'Reportes', icon: <FileText size={20} /> },
    ];

    return (
        <div
            className="sidebar"
            style={{ width: isOpen ? '280px' : '0', opacity: isOpen ? 1 : 0 }}
        >
            <div className="sidebar-header">
                <div style={{
                    minWidth: '36px', height: '36px',
                    backgroundColor: 'var(--primary)',
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                }}>
                    <Hammer size={20} color="white" />
                </div>
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: '800', letterSpacing: '-0.02em', color: 'white' }}>Ebanistería</h2>
                    <span style={{ fontSize: '0.8rem', color: '#F59E0B', letterSpacing: '0.15em', fontWeight: '700' }}>MANAGEMENT</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: '0.05em' }}>
                    Menu
                </div>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <span style={{ marginRight: '12px', display: 'flex' }}>{item.icon}</span>
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {isActive && <ChevronRight size={16} />}
                        </Link>
                    );
                })}
            </nav>

            {user?.role === 'admin' && (
                <div style={{
                    margin: '1rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>DASHBOARD</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>Vista Administrador</div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;

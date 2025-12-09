import { LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navigation = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();

    return (
        <header className="navbar">
            <button
                onClick={toggleSidebar}
                className="btn btn-ghost btn-icon"
                title="Toggle Sidebar"
            >
                <Menu size={24} />
            </button>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-right">
                    <div className="block">
                        <span className="block text-sm font-semibold text-main">
                            {user?.full_name}
                        </span>
                        <span className="block text-xs text-secondary capitalize">
                            {user?.role === 'admin' ? 'Administrador' : 'Empleado'}
                        </span>
                    </div>
                    <div style={{
                        width: '36px', height: '36px',
                        backgroundColor: 'var(--bg-body)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--border)'
                    }}>
                        <User size={18} color="var(--text-secondary)" />
                    </div>
                </div>

                <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)' }}></div>

                <button
                    onClick={logout}
                    className="btn btn-danger-outline p-2"
                    title="Cerrar Sesión"
                >
                    <LogOut size={18} /> <span className="hidden md:inline">Salir</span>
                </button>
            </div>
        </header>
    );
};

export default Navigation;

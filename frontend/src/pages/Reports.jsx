import { useState, useEffect } from 'react';
import api from '@/services/api'; // Using alias
import DataTable from '@/components/DataTable'; // Using alias
import { Download, TrendingUp, DollarSign, Package, FileText } from 'lucide-react';

const Reports = () => {
    const [reportData, setReportData] = useState({
        orders: [],
        summary: { total_orders: 0, total_value: 0, by_status: {} }
    });
    const [inventoryStats, setInventoryStats] = useState({ total_items: 0, total_value: 0, low_stock_items: 0 });
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        status: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReports();
        fetchInventoryStats();
    }, []); // Initial load

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;
            if (filters.status) params.status = filters.status;

            const response = await api.get('/reports/orders', { params });
            setReportData(response.data.data);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventoryStats = async () => {
        try {
            const response = await api.get('/reports/inventory');
            setInventoryStats(response.data.data);
        } catch (error) {
            console.error('Error loading inventory stats:', error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = (e) => {
        e.preventDefault();
        fetchReports();
    };

    const handleExportCSV = () => {
        const headers = ['Pedido #', 'Cliente', 'Fecha', 'Monto', 'Estado'];
        const rows = reportData.orders.map(o => [
            o.order_number,
            o.customer_name,
            new Date(o.created_at).toLocaleDateString(),
            o.agreed_price,
            o.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "orders_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = async () => {
        try {
            const params = {};
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;
            if (filters.status) params.status = filters.status;

            const response = await api.get('/reports/orders/pdf', {
                params,
                responseType: 'blob' // Important for binary data
            });

            // Create a Blob from the PDF Stream
            const file = new Blob(
                [response.data],
                { type: 'application/pdf' }
            );

            // Build a URL from the file
            const fileURL = URL.createObjectURL(file);

            // Open the URL on new Window
            const pdfWindow = window.open(fileURL);
            if (pdfWindow) {
                pdfWindow.focus();
            } else {
                // Fallback for blockers: download it
                const link = document.createElement('a');
                link.href = fileURL;
                link.setAttribute('download', `reporte_pedidos_${Date.now()}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error al exportar PDF');
        }
    };

    const columns = [
        { header: 'Fecha', accessor: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
        { header: 'Pedido #', accessor: 'order_number' },
        { header: 'Cliente', accessor: 'customer_name' },
        { header: 'Tipo', accessor: 'furniture_type' },
        { header: 'Estado', accessor: 'status' },
        { header: 'Monto', accessor: 'agreed_price', render: (row) => `$${row.agreed_price}` }
    ];

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="card" style={{ flex: 1, minWidth: '250px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: '0.625rem', backgroundColor: `${color}15`, color: color }}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-secondary font-medium text-sm mb-1">{title}</p>
                <p className="text-main font-bold text-xl m-0">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl md:text-2xl m-0">Reportes</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="btn btn-outline"
                    >
                        <Download size={18} /> <span className="hidden md:inline">CSV</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="btn btn-primary"
                    >
                        <FileText size={18} /> Exportar PDF
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
                <StatCard title="Ingresos Totales" value={`$${reportData.summary.total_value.toFixed(2)}`} icon={DollarSign} color="#10B981" />
                <StatCard title="Total Pedidos" value={reportData.summary.total_orders} icon={TrendingUp} color="#3B82F6" />
                <StatCard title="Valor Inventario" value={`$${(parseFloat(inventoryStats.total_value) || 0).toFixed(2)}`} icon={Package} color="#F59E0B" />
            </div>

            <form onSubmit={handleApplyFilters} className="card p-6 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="form-label">Fecha Inicio</label>
                    <input type="date" name="start_date" className="form-input" value={filters.start_date} onChange={handleFilterChange} />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="form-label">Fecha Fin</label>
                    <input type="date" name="end_date" className="form-input" value={filters.end_date} onChange={handleFilterChange} />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="form-label">Estado</label>
                    <select name="status" className="form-input" value={filters.status} onChange={handleFilterChange}>
                        <option value="">Todos</option>
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="completed">Completado</option>
                        <option value="delivered">Entregado</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-primary">Aplicar Filtros</button>
            </form>

            <DataTable
                columns={columns}
                data={reportData.orders}
                isLoading={loading}
            />
        </div>
    );
};

export default Reports;

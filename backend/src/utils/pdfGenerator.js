const PDFDocument = require('pdfkit');

const generateOrdersPDF = (orders, filters) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        doc.on('error', (err) => {
            reject(err);
        });

        // --- Header ---
        doc.fillColor('#8B4513')
            .fontSize(20)
            .text('Ebanistería Madera', { align: 'center' })
            .fontSize(12)
            .text('Reporte de Pedidos', { align: 'center' });

        doc.moveDown();

        // --- Filters Info ---
        doc.fillColor('#444444').fontSize(10);
        const filterText = [];
        if (filters.start_date) filterText.push(`Desde: ${filters.start_date}`);
        if (filters.end_date) filterText.push(`Hasta: ${filters.end_date}`);
        if (filters.status) filterText.push(`Estado: ${filters.status}`);

        doc.text(`Generado el: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { align: 'right' });
        if (filterText.length > 0) {
            doc.text(`Filtros: ${filterText.join(' | ')}`, { align: 'left' });
        }

        doc.moveDown();

        // --- Table Header ---
        const tableTop = doc.y;
        const itemCodeX = 50;
        const descriptionX = 150;
        const dateX = 300;
        const statusX = 400;
        const amountX = 500;

        doc.font('Helvetica-Bold');
        doc.text('Pedido #', itemCodeX, tableTop);
        doc.text('Cliente / Tipo', descriptionX, tableTop);
        doc.text('Fecha', dateX, tableTop);
        doc.text('Estado', statusX, tableTop);
        doc.text('Monto', amountX, tableTop);

        doc.moveTo(50, tableTop + 15)
            .lineTo(550, tableTop + 15)
            .strokeColor('#aaaaaa')
            .stroke();

        let y = tableTop + 25;
        doc.font('Helvetica');

        // --- Table Rows ---
        let totalAmount = 0;

        orders.forEach(order => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            doc.fontSize(10)
                .text(order.order_number, itemCodeX, y)
                .text(order.customer_name, descriptionX, y, { width: 140, ellipsis: true })
                .text(new Date(order.created_at).toLocaleDateString(), dateX, y)
                .text(order.status, statusX, y)
                .text(`$${order.agreed_price}`, amountX, y);

            doc.fontSize(8)
                .fillColor('#777777')
                .text(order.furniture_type, descriptionX, y + 12);

            doc.fillColor('#444444'); // Reset color

            y += 30;
            totalAmount += parseFloat(order.agreed_price);
        });

        doc.moveTo(50, y)
            .lineTo(550, y)
            .strokeColor('#aaaaaa')
            .stroke();

        y += 15;

        // --- Summary ---
        doc.font('Helvetica-Bold')
            .fontSize(12)
            .text('Total:', statusX, y)
            .text(`$${totalAmount.toFixed(2)}`, amountX, y);

        doc.end();
    });
};

module.exports = { generateOrdersPDF };

import PDFDocument from "pdfkit";

// ============ FORMAT HELPERS ============

export const formatCurrency = (value) => {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString('en-GB');
};

export const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

export const calculateDuration = (startTime, endTime) => {
    const diff = new Date(endTime) - new Date(startTime);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h${minutes}min`;
    }
    return `${minutes}min`;
};

// ============ DATA PROCESSING HELPERS ============

export const flattenOrderItems = (orders) => {
    let items = [];
    let index = 1;
    
    orders.forEach(order => {
        order.items.forEach(item => {
            items.push({
                stt: index++,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                modifiers: item.modifiers || [],
                note: item.note || ''
            });
        });
    });
    
    return items;
};

export const calculateItemTotal = (item) => {
    let total = item.price * item.quantity;
    if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(mod => {
            total += mod.price * item.quantity;
        });
    }
    return total;
};

export const calculateGrandTotal = (items) => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
};

// ============ BILL DATA PREPARATION ============

export const prepareBillData = (session, orders) => {
    const restaurant = session.restaurantId;
    const items = flattenOrderItems(orders);
    const subtotal = calculateGrandTotal(items);
    const discountPercentage = session.discountPercentage || 0;
    const discountAmount = session.discountAmount || 0;
    const grandTotal = session.finalAmount || subtotal;
    
    return {
        session,
        orders,
        restaurant,
        items,
        subtotal,
        discountPercentage,
        discountAmount,
        grandTotal,
        tableName: session.tableId?.name || 'N/A',
        tableLocation: session.tableId?.location || '',
        paymentMethod: session.paymentMethod === 'cash' ? 'Cash' : 'Bank Transfer'
    };
};

// ============ BILL CONTENT RENDERER ============

export const renderBillContent = (doc, data) => {
    const { session, orders, restaurant, items, subtotal, discountPercentage, discountAmount, grandTotal, tableName, tableLocation, paymentMethod } = data;
    
    // Header - Restaurant Info
    doc.fontSize(11).font('Courier-Bold').text(restaurant.name.toUpperCase(), { align: 'center' });
    doc.fontSize(8).font('Courier').text(restaurant.address || '', { align: 'center' });
    if (restaurant.contact?.phone) doc.text(`Tel: ${restaurant.contact.phone}`, { align: 'center' });
    if (restaurant.contact?.email) doc.text(`Email: ${restaurant.contact.email}`, { align: 'center' });
    doc.moveDown(0.5);
    
    // Receipt Header
    doc.text('------------------------------------------');
    doc.fontSize(10).font('Courier-Bold').text('PAYMENT RECEIPT', { align: 'center' });
    doc.moveDown(0.4);
    
    // Receipt Info
    doc.fontSize(8).font('Courier');
    doc.text(`Receipt No : ${session.orderCode || session._id.toString().slice(-6)}`);
    doc.text(`Date       : ${formatDateTime(session.endTime || new Date())}`);
    doc.text(`Table      : ${tableName}${tableLocation ? ' - ' + tableLocation : ''}`);
    doc.text(`Cashier    : ${orders.find(o => o.servedBy)?.servedBy?.fullName || 'N/A'}`);
    doc.moveDown(0.5);
    
    // Order Details Section
    doc.text('------------------------------------------');
    doc.font('Courier-Bold').text('ORDER DETAILS', { align: 'center' });
    doc.moveDown(0.4);
    doc.font('Courier-Bold').text('Item                 Qty    Price   Amount');
    doc.font('Courier').text('------------------------------------------');
    
    // Items List
    items.forEach(item => {
        const itemTotal = calculateItemTotal(item);
        const itemName = item.name.substring(0, 20).padEnd(20);
        const qty = item.quantity.toString().padStart(3);
        const price = formatCurrency(item.price).padStart(8);
        const amount = formatCurrency(itemTotal).padStart(8);
        
        doc.font('Courier').text(`${itemName} ${qty} ${price} ${amount}`);
        
        // Modifiers
        if (item.modifiers.length > 0) {
            item.modifiers.forEach(mod => {
                doc.fontSize(7).text(`  + ${mod.name} (${formatCurrency(mod.price)})`);
            });
            doc.fontSize(8);
        }
        
        // Note
        if (item.note) {
            doc.fontSize(7).text(`  * Note: ${item.note}`);
            doc.fontSize(8);
        }
    });
    
    // Total
    doc.moveDown(0.5);
    doc.text('------------------------------------------');
    doc.fontSize(9).font('Courier');
    const subtotalY = doc.y;
    doc.text('Subtotal:', 10, subtotalY);
    doc.text(`$${formatCurrency(subtotal)}`, 10, subtotalY, { width: 200, align: 'right' });
    
    if (discountPercentage > 0) {
        doc.moveDown(0.3);
        const discountY = doc.y;
        doc.text(`Discount (${discountPercentage}%):`, 10, discountY);
        doc.text(`$${formatCurrency(discountAmount)}`, 10, discountY, { width: 200, align: 'right' });
    }
    
    doc.moveDown(0.5);
    doc.text('--------------------------------------');
    const totalY = doc.y;
    doc.fontSize(10).font('Courier-Bold');
    doc.text('TOTAL:', 10, totalY);
    doc.text(`${formatCurrency(grandTotal)}`, 10, totalY, { width: 200, align: 'right' });
    doc.moveDown(0.5);
    
    // Payment Info
    doc.fontSize(8).font('Courier').text('------------------------------------------');
    doc.font('Courier-Bold').text('PAYMENT INFO', { align: 'center' });
    doc.moveDown(0.4);
    doc.font('Courier');
    doc.text(`Payment Method : ${paymentMethod}`);
    if (session.paymentMethod === 'transfer' && restaurant.payosConfig?.accountHolder) {
        doc.text(`Account Holder : ${restaurant.payosConfig.accountHolder}`);
    }
    doc.text(`Status         : PAID`);
    doc.moveDown(0.5);
    
    // Service Time
    doc.text('------------------------------------------');
    doc.font('Courier-Bold').text('SERVICE TIME', { align: 'center' });
    doc.moveDown(0.4);
    doc.font('Courier');
    if (session.startTime) doc.text(`Check-in  : ${formatTime(session.startTime)}`);
    doc.text(`Check-out : ${formatTime(session.endTime || new Date())}`);
    if (session.startTime) {
        const duration = calculateDuration(session.startTime, session.endTime || new Date());
        doc.text(`Duration  : ${duration}`);
    }
    doc.moveDown(0.5);
    
    // Order History
    doc.text('------------------------------------------');
    doc.font('Courier-Bold').text('ORDER HISTORY', { align: 'center' });
    doc.moveDown(0.4);
    doc.font('Courier');
    orders.forEach((order, index) => {
        doc.text(`Order #${index + 1} - ${formatTime(order.createdAt)}`);
        order.items.forEach(item => {
            doc.text(` + ${item.name} x${item.quantity}`);
        });
        if (index < orders.length - 1) doc.moveDown(0.2);
    });
    
    // Footer
    doc.moveDown(1);
    doc.text('------------------------------------------');
    doc.font('Courier-Bold').text('THANK YOU FOR YOUR PURCHASE!', { align: 'center' });
    doc.font('Courier').text('Please come again', { align: 'center' });
};

// ============ MAIN BILL PDF GENERATOR ============

export const generateBillPDF = (res, session, orders) => {
    // Prepare data
    const billData = prepareBillData(session, orders);
    
    // Step 1: Dry run to calculate height
    const dryDoc = new PDFDocument({ size: [226, 10000], margin: 10 });
    dryDoc.font('Courier');
    renderBillContent(dryDoc, billData);
    const calculatedHeight = dryDoc.y + 20;
    
    // Step 2: Create actual PDF with calculated height
    const doc = new PDFDocument({ size: [226, calculatedHeight], margin: 10 });
    
    // Set response headers
    const filename = 'bill.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    
    // Render content
    doc.font('Courier');
    renderBillContent(doc, billData);
    
    doc.end();
};

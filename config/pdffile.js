const Order = require('../models/orderModel');
const ExcelJS = require('exceljs');

const exportOrders = async (req, res) => {
  try {
    const month = req.params.month; // month in 00 format
    const year = req.params.year; // year in YYYY format
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(`${year}-${month}-31`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    worksheet.columns = [
        { header: 'Order ID', key: 'orderId' },
        { header: 'User', key: 'user' },
        { header: 'Payment', key: 'payment' },
        { header: 'Total', key: 'total' },
        { header: 'Date', key: 'date' },
      ];

    let counter = 1;
    let totalSales = 0;

    const salesData = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: 'delivered',
    }).populate('userId');

    salesData.forEach((sale) => {
        const saleObject = {
          orderId: sale._id.toString(),
          user: `${sale.userId.username} (${sale.userId.email})`,
          payment: sale.paymentMethod,
          total: sale.totalAmount,
          date: sale.createdAt.toISOString(),
        };
        totalSales += sale.totalAmount;
        worksheet.addRow(saleObject);
        counter++;
      });
      
    worksheet.addRow({ user: 'Total', total: totalSales });
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheatml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=sales_Report.xlsx');
    await workbook.xlsx.write(res); // wait for the workbook to be written
    res.status(200).end(); // end the response
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal server error');
  }
};

module.exports = {
  exportOrders,
};

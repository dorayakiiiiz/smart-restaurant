// PDF Generator Helper for Reports
import PDFDocument from "pdfkit";

export const generateSalesReportPDF = (res, data) => {
  const {
    restaurant,
    period,
    currentStart,
    currentEnd,
    currentMetrics,
    trends,
    revenueData,
    topItems,
  } = data;

  // Create PDF
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  const filename = `Sales_Report_${restaurant.slug || "restaurant"}_${period}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  doc.pipe(res);

  // Helper functions
  const formatCurrency = (value) => `$${value.toFixed(2)}`;
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const formatPeriod = () => {
    const labels = {
      today: "Today",
      yesterday: "Yesterday",
      week: "Last 7 Days",
      month: "Last 30 Days",
      custom: "Custom Range",
    };
    return labels[period] || "Last 7 Days";
  };

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // --- PAGE CONTENT ---

  // Header Background (Green bar)
  doc.rect(0, 0, pageWidth, 120).fill("#10b981");

  // Title
  doc
    .font("Helvetica-Bold")
    .fontSize(32)
    .fillColor("#ffffff")
    .text("SALES REPORT", margin, 50, { width: contentWidth, align: "center" });

  // White content area
  doc.rect(0, 120, pageWidth, pageHeight - 120).fill("#ffffff");

  // Restaurant Info Box
  doc.roundedRect(margin, 140, contentWidth, 70, 8).fill("#f9fafb");

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#1f2937")
    .text(restaurant.name, margin + 20, 155, {
      width: contentWidth - 40,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#6b7280")
    .text(`Report Period: ${formatPeriod()}`, margin + 20, 178, {
      width: contentWidth - 40,
      align: "center",
    })
    .text(
      `${formatDate(currentStart)} - ${formatDate(currentEnd)}`,
      margin + 20,
      193,
      { width: contentWidth - 40, align: "center" },
    );

  // Summary Metrics Section
  let y = 230;

  // Section Title with underline
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#1f2937")
    .text("KEY PERFORMANCE INDICATORS", margin, y);
  doc
    .moveTo(margin, y + 18)
    .lineTo(pageWidth - margin, y + 18)
    .lineWidth(2)
    .stroke("#10b981");

  y += 35;

  const metrics = [
    {
      label: "Total Revenue",
      value: formatCurrency(currentMetrics.totalRevenue),
      trend: trends.revenue,
    },
    {
      label: "Total Orders",
      value: currentMetrics.totalOrders.toString(),
      trend: trends.orders,
    },
    {
      label: "Avg Order Value",
      value: formatCurrency(currentMetrics.avgOrderValue),
      trend: trends.avgOrderValue,
    },
    {
      label: "Avg Prep Time",
      value: `${Math.round(currentMetrics.avgPrepTime / 60)} min`,
      trend: trends.avgPrepTime,
    },
  ];

  // Draw metric cards in 2x2 grid
  metrics.forEach((metric, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cardX = margin + col * (contentWidth / 2 + 5);
    const cardY = y + row * 85;
    const cardWidth = contentWidth / 2 - 5;
    const cardHeight = 75;

    // Card background with shadow effect
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 6).fill("#ffffff");
    doc
      .roundedRect(cardX, cardY, cardWidth, cardHeight, 6)
      .lineWidth(1)
      .stroke("#e5e7eb");

    // Label
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#6b7280")
      .text(metric.label, cardX + 15, cardY + 15, { width: cardWidth - 30 });

    // Value
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#1f2937")
      .text(metric.value, cardX + 15, cardY + 30, { width: cardWidth - 80 });

    // Trend badge
    const trendBgColor = metric.trend.isPositive ? "#d1fae5" : "#fee2e2";
    const trendTextColor = metric.trend.isPositive ? "#065f46" : "#991b1b";
    const trendSymbol = metric.trend.direction === "up" ? "+" : "-";
    const trendText = `${trendSymbol}${metric.trend.value}%`;

    doc
      .roundedRect(cardX + cardWidth - 70, cardY + 12, 55, 20, 4)
      .fill(trendBgColor);
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(trendTextColor)
      .text(trendText, cardX + cardWidth - 65, cardY + 17);
  });

  // Revenue Over Time Section
  y = 420;

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#1f2937")
    .text("REVENUE BREAKDOWN", margin, y);
  doc
    .moveTo(margin, y + 18)
    .lineTo(pageWidth - margin, y + 18)
    .lineWidth(2)
    .stroke("#10b981");

  y += 30;

  // Table header with background
  doc.roundedRect(margin, y, contentWidth, 25, 4).fill("#f3f4f6");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#374151");
  doc.text("DATE", margin + 15, y + 8);
  doc.text("REVENUE", margin + 200, y + 8);
  doc.text("ORDERS", margin + 350, y + 8);
  doc.text("AVG/ORDER", margin + 450, y + 8);

  y += 30;

  // Table rows with alternating colors
  doc.font("Helvetica").fontSize(9).fillColor("#1f2937");

  revenueData.slice(0, 8).forEach((item, index) => {
    if (index % 2 === 0) {
      doc.rect(margin, y - 3, contentWidth, 20).fill("#fafafa");
    }

    doc.fillColor("#1f2937");
    doc.text(formatDate(item.date), margin + 15, y);
    doc.fillColor("#10b981").font("Helvetica-Bold");
    doc.text(formatCurrency(item.revenue), margin + 200, y);
    doc.fillColor("#1f2937").font("Helvetica");
    doc.text(item.orderCount.toString(), margin + 350, y);
    const avgOrder = item.orderCount > 0 ? item.revenue / item.orderCount : 0;
    doc.text(formatCurrency(avgOrder), margin + 450, y);
    y += 20;
  });

  // Top Selling Items Section
  y += 15;

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#1f2937")
    .text("TOP SELLING ITEMS", margin, y);
  doc
    .moveTo(margin, y + 18)
    .lineTo(pageWidth - margin, y + 18)
    .lineWidth(2)
    .stroke("#10b981");

  y += 30;

  // Table header
  doc.roundedRect(margin, y, contentWidth, 25, 4).fill("#f3f4f6");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#374151");
  doc.text("#", margin + 15, y + 8);
  doc.text("ITEM NAME", margin + 50, y + 8);
  doc.text("QTY", margin + 320, y + 8);
  doc.text("REVENUE", margin + 420, y + 8);

  y += 30;

  // Items with rank numbers (no medals)
  doc.font("Helvetica").fontSize(9).fillColor("#1f2937");

  topItems.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.rect(margin, y - 3, contentWidth, 20).fill("#fafafa");
    }

    // Rank number only
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1f2937");
    doc.text(`${index + 1}`, margin + 15, y);

    // Item name
    doc.font("Helvetica").fontSize(9).fillColor("#1f2937");
    doc.text(item.name, margin + 50, y, { width: 250, ellipsis: true });

    // Quantity
    doc.text(item.totalQuantity.toString(), margin + 320, y);

    // Revenue in green
    doc.fillColor("#10b981").font("Helvetica-Bold");
    doc.text(formatCurrency(item.totalRevenue), margin + 420, y);

    y += 20;
  });

  // Footer
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#9ca3af")
    .text(
      `Generated by Smart Restaurant System on ${new Date().toLocaleString("en-US")}`,
      margin,
      pageHeight - 30,
      { width: contentWidth, align: "center" },
    );

  // Page border
  doc
    .rect(15, 15, pageWidth - 30, pageHeight - 30)
    .lineWidth(1)
    .stroke("#e5e7eb");

  doc.end();
};

// Tạo báo cáo doanh thu dạng PDF với biểu đồ và thống kê chi tiết

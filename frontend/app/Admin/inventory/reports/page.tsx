"use client"

import { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StockReport {
  batch_id: number;
  current_stock: number;
  minimum_stock: number;
  expiry_date: string;
  stock_date: string;
  item: {
    item_id: number;
    item_name: string;
    unit_of_measurement: string;
    unit_price: number;
  }
}

interface UsageReport {
  stock_issue_id: number;
  quantity: number;
  usage_type: string;
  issued_to: string;
  date: string;
  batch: {
    batch_id: number;
    item: {
      item_id: number;
      item_name: string;
      unit_of_measurement: string;
      unit_price: number;
    };
  }
}

interface PurchaseReport {
  quantity: number;
  purchase_order: {
    purchase_order_id: number;
    requested_by: string;
    expected_delivery_date: string;
    order_date: string;
    supplier: {
      supplier_id: number;
      supplier_name: string;
    };
  }
  item: {
    item_id: number;
    item_name: string;
    unit_of_measurement: string;
    unit_price: number;
  };
}

const report = () => {
  const [isFetchingStockReports, setIsFetchingStockReports] = useState<boolean>(false);
  const [isFetchingUsageReports, setIsFetchingUsageReports] = useState<boolean>(false);
  const [isFetchingPurchaseReports, setIsFetchingPurchaseReports] = useState<boolean>(false);

  const [stockReports, setStockReports] = useState<StockReport[]>([]);
  const [usageReports, setUsageReports] = useState<UsageReport[]>([]);
  const [purchaseReports, setPurchaseReports] = useState<PurchaseReport[]>([]);

  const { isLoadingAuth, isLoggedIn, user, apiClient } = useContext(AuthContext);
  const router = useRouter();

  function groupPurchaseReports(purchaseReports: PurchaseReport[]) {
    const map = new Map();

    purchaseReports.forEach((report: PurchaseReport) => {
      const supplierId = report.purchase_order.supplier.supplier_id;
      const supplierName = report.purchase_order.supplier.supplier_name;
      const orderDate = new Date(report.purchase_order.order_date);
      const amount = report.quantity * report.item.unit_price;

      if (!map.has(supplierId)) {
        map.set(supplierId, {
          supplierName,
          totalOrders: new Set(),
          totalAmount: 0,
          lastOrder: orderDate,
        });
      }

      const supplierData = map.get(supplierId);
      supplierData.totalOrders.add(report.purchase_order.purchase_order_id);
      supplierData.totalAmount += amount;
      if (orderDate > supplierData.lastOrder) {
        supplierData.lastOrder = orderDate;
      }
    });

    return Array.from(map.values()).map(({ supplierName, totalOrders, totalAmount, lastOrder, status }) => ({
      supplier: supplierName,
      totalOrders: totalOrders.size,
      totalAmount,
      lastOrder: lastOrder.toLocaleDateString(),
      status,
    }));
  };

  const downloadStockReportPDF = () => {
    const doc = new jsPDF();
    const today = new Date();
    const issuedDate = today.toLocaleDateString("en-GB");

    doc.text("Inventory Stock Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Issued on: ${issuedDate}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Batch ID", "Item Name", "Unit", "Current Stock", "Minimum Stock", "Expiry Date"]],
      body: stockReports.map((item) => [
        item.batch_id.toString(),
        item.item.item_name,
        item.item.unit_of_measurement,
        item.current_stock.toString(),
        item.minimum_stock.toString(),
        item.expiry_date,
      ]),
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
      },
    });

    doc.save("stock_report.pdf");
  };

  const downloadSingleStockReportPDF = (item: StockReport) => {
    const doc = new jsPDF();
    doc.text("Inventory Item Report", 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["Field", "Value"]],
      body: [
        ["Report Date", new Date().toISOString().split("T")[0]],
        ["Batch ID", item.batch_id.toString()],
        ["Item Name", item.item.item_name],
        ["Unit of Measurement", item.item.unit_of_measurement],
        ["Unit Price", `Rs. ${item.item.unit_price.toFixed(2)}`],
        ["Current Stock", item.current_stock.toString()],
        ["Minimum Stock", item.minimum_stock.toString()],
        ["Expiry Date", item.expiry_date],
        ["Stock Date", item.stock_date],
      ],
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
      },
    });

    doc.save(`${item.item.item_name}_report.pdf`);
  };


  const fetchStockReports = async () => {
    setIsFetchingStockReports(true);
    try {
      const res = await apiClient.get(
        `/inventory/reports/stock`
      );
      if (res.status == 500) {
        throw new Error("Error Fetching Stock Reports");
      }
      setStockReports(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsFetchingStockReports(false);
    }
  };

  const fetchUsageReports = async () => {
    setIsFetchingUsageReports(true);
    try {
      const res = await apiClient.get(
        `/inventory/reports/usage`
      );
      if (res.status == 500) {
        throw new Error("Error Fetching Usage Reports");
      }
      setUsageReports(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsFetchingUsageReports(false);
    }
  };

  const fetchPurchaseReports = async () => {
    setIsFetchingPurchaseReports(true);
    try {
      const res = await apiClient.get(
        `/inventory/reports/purchase`
      );
      if (res.status == 500) {
        throw new Error("Error Fetching Purchase Reports");
      }
      setPurchaseReports(res.data);
    } catch (err: any) {
      console.error("Unexpected error:", err.message);
    } finally {
      setIsFetchingPurchaseReports(false);
    }
  };

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Please Login")
      router.push("/");
    }
    else if (user.role != "admin") {
      toast.error("Access Denied");
      router.push("/");
    }
  }, [isLoadingAuth]);

  useEffect(() => {
    fetchStockReports();
    fetchUsageReports();
    fetchPurchaseReports();
  }, []);

  const groupedPurchases = groupPurchaseReports(purchaseReports);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-dental-dark">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Analyze your inventory performance and trends</p>
        </div>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger disabled={isFetchingStockReports} value="stock" className="hover:bg-gray-200 hover:text-gray-900">{isFetchingStockReports ? <Loader /> : "Stock Reports"}</TabsTrigger>
          <TabsTrigger disabled={isFetchingUsageReports} value="usage" className="hover:bg-gray-200 hover:text-gray-900">{isFetchingUsageReports ? <Loader /> : "Usage Analytics"}</TabsTrigger>
          <TabsTrigger disabled={isFetchingPurchaseReports} value="purchasing" className="hover:bg-gray-200 hover:text-gray-900">{isFetchingPurchaseReports ? <Loader /> : "Purchase Reports"}</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={downloadStockReportPDF}
              disabled={isFetchingStockReports || stockReports.length === 0}
              className={`flex items-center space-x-1 px-3 py-2 rounded text-sm text-white ${isFetchingStockReports || stockReports.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600"
                }`}
            >
              <Download size={16} />
              <span>Download PDF</span>
            </Button>
          </div>

          {isFetchingStockReports ? (
            <div className="text-center py-20 text-gray-500">Loading stock reports...</div>
          ) : stockReports.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No stock reports available to display.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stockReports.map((report) => {
                const isLow = report.current_stock <= report.minimum_stock;
                const stockPercent = Math.min((report.current_stock / report.minimum_stock) * 100, 100);

                return (
                  <Card key={report.batch_id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold">
                            {report.item.item_name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Batch ID: {report.batch_id}
                          </CardDescription>
                        </div>
                        <button
                          onClick={() => downloadSingleStockReportPDF(report)}
                          className="hover:text-emerald-600 hover:-translate-y-0.5 transition-transform duration-200"
                          title="Download Batch Report"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 text-sm text-gray-700">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500">Stock:</span>{" "}
                          <span className="font-medium">
                            {report.current_stock} {report.item.unit_of_measurement}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Min Stock:</span>{" "}
                          <span className="font-medium">
                            {report.minimum_stock} {report.item.unit_of_measurement}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Stock Date:</span> <span>{report.stock_date}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Expiry:</span> <span>{report.expiry_date}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Unit Price:</span>{" "}
                          <span>Rs. {report.item.unit_price.toFixed(2)}</span>
                        </div>
                      </div>

                      <Progress value={stockPercent} className="h-2" />

                      <Badge
                        variant={report.current_stock === 0 ? "destructive" : "secondary"}
                        className={`w-fit ${report.current_stock === 0
                          ? "bg-red-100 text-red-800"
                          : isLow
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-emerald-100 text-emerald-800"
                          }`}
                      >
                        {report.current_stock === 0 ? "Critical" : isLow ? "Low Stock" : "Sufficient"}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>;

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Details</CardTitle>
              <CardDescription>Recent stock issues with detailed info</CardDescription>
            </CardHeader>
            <CardContent>
              {isFetchingUsageReports ? (
                <div className="text-center py-20 text-gray-500">Loading usage reports...</div>
              ) : usageReports.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No usage reports available to display.</div>
              ) : (
                <div className="space-y-4">
                  {usageReports.map((usage) => (
                    <div
                      key={usage.stock_issue_id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-dental-dark truncate">
                          {usage.batch.item.item_name}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          Batch ID: {usage.batch.batch_id} | Issued To: {usage.issued_to} | Usage Type: {usage.usage_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {new Date(usage.date).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="mt-2 md:mt-0 flex items-center space-x-4 text-sm text-gray-700">
                        <div>
                          <span className="font-semibold">{usage.quantity}</span>{' '}
                          <span>{usage.batch.item.unit_of_measurement}</span>
                        </div>
                        <div>
                          Unit Price: <span className="font-semibold">Rs. {usage.batch.item.unit_price.toFixed(2)}</span>
                        </div>
                        <div>
                          Total: <span className="font-semibold">Rs. {(usage.quantity * usage.batch.item.unit_price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchasing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Summary by Supplier</CardTitle>
              <CardDescription>Purchase order summary for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {isFetchingPurchaseReports ? (
                <div className="text-center py-20 text-gray-500">Loading purchase reports...</div>
              ) : groupedPurchases.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No purchase reports available to display.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-900">Supplier</th>
                        <th className="text-left p-4 font-semibold text-gray-900">Orders</th>
                        <th className="text-left p-4 font-semibold text-gray-900">Total Amount</th>
                        <th className="text-left p-4 font-semibold text-gray-900">Last Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {groupedPurchases.map((purchase, index) => (
                        <tr key={index} className="cursor-default">
                          <td className="p-4 font-medium text-dental-dark">{purchase.supplier}</td>
                          <td className="p-4">{purchase.totalOrders}</td>
                          <td className="p-4 font-medium">Rs. {purchase.totalAmount.toFixed(2)}</td>
                          <td className="p-4 text-gray-600">{purchase.lastOrder}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default report;
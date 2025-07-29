import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
    Package,
    Layers,
    Calendar,
    CalendarDaysIcon,
    Truck,
    Barcode,
    Eye,
    Edit,
    Trash,
    Minus,
} from "lucide-react";
import React from "react";

interface ItemCardProps {
    item: any;
    itemBatches: any[];
    totalStock: number;
    isLowStock: boolean;
    onView: (item: any) => void;
    onEdit: (item: any) => void;
    onDelete: (item: any) => void;
    onStockOut: (item: any) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
    item,
    itemBatches,
    totalStock,
    isLowStock,
    onView,
    onEdit,
    onDelete,
    onStockOut,
}) => {
    const getStatusBadge = (stock: number, min: number) => {
        const isLow = stock <= min;
        return (
            <Badge variant={isLow ? "destructive" : "default"}>
                {isLow ? "Low Stock" : "In Stock"}
            </Badge>
        );
    };

    return (
        <Card className="flex flex-col hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg font-semibold truncate">{item.item_name}</CardTitle>
                        </div>
                        <div className="flex items-center mt-1 gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                                {item.sub_category?.sub_category_name || "Uncategorized"}
                            </Badge>
                            {item.batch_tracking && (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                    <Layers className="h-3 w-3" />
                                    Batch Tracking
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="ml-2">{getStatusBadge(totalStock, item.minimum_stock)}</div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-4 space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-500">Current Stock</span>
                        <span className={`text-lg font-bold ${isLowStock ? "text-amber-500" : "text-primary"}`}>
                            {totalStock} {item.unit_of_measurements}
                        </span>
                    </div>
                    {!item.batch_tracking && (
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Min. Required:</span>
                            <span className="font-medium">
                                {itemBatches[0]?.minimum_stock || item.minimum_stock} {item.unit_of_measurements}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Unit Price</span>
                    <span className="text-base font-bold text-amber-700 dark:text-amber-400">
                        ${parseFloat(item.unit_price).toFixed(2)}
                    </span>
                </div>

                {item.batch_tracking ? (
                    <div className="space-y-3 mt-3">
                        <div className="flex items-center justify-between text-sm font-medium text-gray-500 mb-2">
                            <span>Batches</span>
                            <Badge variant="outline" className="text-xs">
                                {itemBatches.length} {itemBatches.length === 1 ? "Batch" : "Batches"}
                            </Badge>
                        </div>

                        {itemBatches.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {itemBatches.map((batch) => {
                                    const isExpired = batch.expiry_date && new Date(batch.expiry_date) < new Date();
                                    return (
                                        <div key={batch.batch_id} className="p-3 border rounded-lg hover:border-primary/50">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium text-sm">Batch #{batch.batch_id}</span>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${isExpired
                                                            ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                                                            : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                                        }`}
                                                >
                                                    {batch.current_stock} {item.unit_of_measurements}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                                {batch.expiry_date && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-gray-400" />
                                                        <span className={isExpired ? "text-red-500" : "text-gray-500"}>
                                                            {new Date(batch.expiry_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                                {batch.stock_date && (
                                                    <div className="flex items-center gap-1">
                                                        <CalendarDaysIcon className="h-3 w-3 text-gray-400" />
                                                        <span className="text-gray-500">
                                                            {new Date(batch.stock_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Package className="h-5 w-5 mx-auto mb-1 text-gray-300" />
                                <p>No batches available</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2 mt-3">
                        {itemBatches[0]?.expiry_date && (
                            <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Calendar className="h-4 w-4" />
                                    <span>Expires</span>
                                </div>
                                <span
                                    className={`font-medium ${new Date(itemBatches[0].expiry_date) < new Date()
                                            ? "text-red-500"
                                            : "text-gray-700 dark:text-gray-300"
                                        }`}
                                >
                                    {new Date(itemBatches[0].expiry_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {itemBatches[0]?.stock_date && (
                            <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <CalendarDaysIcon className="h-4 w-4" />
                                    <span>Stock Date</span>
                                </div>
                                <span className="text-gray-700 dark:text-gray-300">
                                    {new Date(itemBatches[0].stock_date).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 pt-3 border-t">
                    {item.supplier && (
                        <div className="flex justify-between items-center py-1.5 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Truck className="h-3.5 w-3.5" />
                                <span>Supplier</span>
                            </div>
                            <span
                                className="font-medium text-sm truncate max-w-[150px]"
                                title={item.supplier.company_name}
                            >
                                {item.supplier.company_name}
                            </span>
                        </div>
                    )}
                    {item.barcode && (
                        <div className="flex justify-between items-center py-1.5 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Barcode className="h-3.5 w-3.5" />
                                <span>Barcode</span>
                            </div>
                            <code className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                {item.barcode}
                            </code>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardContent className="pt-0 pb-3 px-4">
                <div className="flex justify-between items-center border-t pt-3">
                    <div className="flex gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(item)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Item</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onStockOut(item)}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Stock Out</TooltipContent>
                        </Tooltip>
                    </div>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => onDelete(item)}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Item</TooltipContent>
                    </Tooltip>
                </div>
            </CardContent>
        </Card>
    );
};

export default ItemCard;

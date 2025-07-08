'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Upload, BarChart3 } from "lucide-react";

const quickActions = [
  { icon: <UserPlus />, label: "Add New Staff", action: () => console.log('Add New Staff clicked') },
  { icon: <Upload />, label: "Upload Documents", action: () => console.log('Upload Documents clicked') },
  { icon: <BarChart3 />, label: "Generate Reports", action: () => console.log('Generate Reports clicked') },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex items-center justify-start gap-2 h-12"
              onClick={action.action}
            >
              <span className="text-xl">{action.icon}</span>
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ParentCategory {
  parent_category_id?: number;
  parent_category_name: string;
  description: string;
}

interface AddParentCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (category: ParentCategory) => void;
  editCategory?: ParentCategory;
}

export function AddParentCategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  editCategory
}: AddParentCategoryDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const category: ParentCategory = {
      ...(editCategory?.parent_category_id ? { parent_category_id: editCategory.parent_category_id } : {}),
      parent_category_name: formData.get('parent_category_name') as string,
      description: formData.get('description') as string,
    };

    onSubmit(category);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editCategory ? 'Edit Parent Category' : 'Add Parent Category'}</DialogTitle>
          <DialogDescription>
            {editCategory ? 'Edit the details for this parent category' : 'Create a new parent category for organizing inventory items'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parent_category_name">Category Name *</Label>
              <Input 
                id="parent_category_name" 
                name="parent_category_name" 
                required 
                placeholder="Enter category name"
                defaultValue={editCategory?.parent_category_name || ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Enter category description"
                defaultValue={editCategory?.description || ''}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
              >
                {editCategory ? 'Save Changes' : 'Add Category'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
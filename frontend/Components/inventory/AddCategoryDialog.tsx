import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "lucide-react";

interface ParentCategory {
  parent_category_id: number;
  parent_category_name: string;
}

interface SubCategory {
  sub_category_id?: number;
  sub_category_name: string;
  description: string;
  parent_category_id: number | null;
}

interface AddCategoryDialogProps {
  onSubmitChange: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (category: SubCategory) => void;
  parentCategories: ParentCategory[];
  editCategory?: SubCategory;
}

export function AddCategoryDialog({
  onSubmitChange,
  open,
  onOpenChange,
  onSubmit,
  parentCategories,
  editCategory
}: AddCategoryDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const category: SubCategory = {
      ...(editCategory?.sub_category_id ? { sub_category_id: editCategory.sub_category_id } : {}),
      sub_category_name: formData.get('sub_category_name') as string,
      description: formData.get('description') as string,
      parent_category_id: parseInt(formData.get('parent_category_id') as string) || null,
    };

    onSubmit(category);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editCategory ? 'Edit Sub Category' : 'Add New Sub Category'}</DialogTitle>
          <DialogDescription>
            {editCategory ? 'Edit the details for this sub category' : 'Create a new sub category for organizing inventory items'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sub_category_name">Category Name *</Label>
              <Input 
                id="sub_category_name" 
                name="sub_category_name" 
                required 
                placeholder="Enter category name"
                defaultValue={editCategory?.sub_category_name || ''}
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

            <div className="space-y-2">
              <Label htmlFor="parent_category_id">Parent Category</Label>
              <Select 
                name="parent_category_id" 
                defaultValue={editCategory?.parent_category_id?.toString()}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.map((category) => (
                    <SelectItem 
                      key={category.parent_category_id} 
                      value={category.parent_category_id.toString()}
                    >
                      {category.parent_category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={onSubmitChange}
                type="submit" 
                className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
              >
                {onSubmitChange? <Loader/> : editCategory ? 'Save Changes' : 'Add Category' }
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
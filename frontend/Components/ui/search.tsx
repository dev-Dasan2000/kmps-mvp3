import React from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from './input';

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onChange: (value: string) => void;
  value: string;
  placeholder?: string;
  className?: string;
}

export const Search = ({
  onChange,
  value,
  placeholder = "Search...",
  className = "",
  ...props
}: SearchProps) => {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-10 ${className}`}
        {...props}
      />
    </div>
  );
}; 
import React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
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
        className={`pl-10 pr-10 ${className}`}
        {...props}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}; 
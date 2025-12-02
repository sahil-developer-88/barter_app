
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchFilters from '@/components/SearchFilters';

interface SearchSectionProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  categories: string[];
}

const SearchSection: React.FC<SearchSectionProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  locationFilter,
  setLocationFilter,
  showFilters,
  setShowFilters,
  categories
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search businesses, services..."
            className="pl-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Input
            type="text"
            placeholder="Location"
            className="pl-10 w-full md:w-40"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <SearchFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
};

export default SearchSection;

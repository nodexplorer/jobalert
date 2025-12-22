interface CategoryBarProps {
    category: string;
    count: number;
}

export function CategoryBar({ category, count }: CategoryBarProps) {
    // Normalize value for bar width (assuming max is somewhat relative, or we could pass max)
    // For simplicity, let's just show the number without a relative bar for now, 
    // or assume a max of 100 for percentage if not provided.
    // Better approach: just a simple list item with a count for now.

    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
                <div className="w-2 h-10 bg-blue-500 rounded-full" />
                <span className="font-medium text-gray-700 capitalize">
                    {category.replace('-', ' ')}
                </span>
            </div>
            <span className="font-bold text-gray-900">{count}</span>
        </div>
    );
}

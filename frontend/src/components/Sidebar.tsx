// src/components/Sidebar.tsx 

interface FiltersType {
  jobType: string[];
  payment: string[];    
  postedWithin: string;
  keywords: string;
}

interface SidebarProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

export default function Sidebar({ filters, onFiltersChange }: SidebarProps) {
  const handleFilterChange = (key: string, value: string | string[]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: string, value: string) => {
    const current = filters[key as keyof typeof filters] as string[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    handleFilterChange(key, updated);
  };

  return (
    <div className="space-y-6">
      {/* Boost Visibility Card */}
      <div className="bg-gradient-to-br from-purple-100 to-pink-50 rounded-2xl p-6 border border-purple-200">
        <h3 className="font-bold text-gray-900 mb-3">Boost Your Visibility</h3>
        <div className="flex items-start gap-2 mb-4">
          <span className="text-green-600">🚀</span>
          <p className="text-sm text-gray-700">
            Priority Alerts & Early Access to jobs
          </p>
        </div>
        <button className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors">
          Upgrade to Pro
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
          <button
            onClick={() => onFiltersChange({
              jobType: [],
              payment: [],
              postedWithin: '',
              keywords: '',
            })}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear
          </button>
        </div>

        {/* Job Type */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Job type</label>
          <div className="space-y-2">
            <FilterCheckbox
              label="short form"
              checked={filters.jobType.includes('short_form')}
              onChange={() => toggleArrayFilter('jobType', 'short_form')}
              color="green"
            />
            <FilterCheckbox
              label="Leng form"
              checked={filters.jobType.includes('long_form')}
              onChange={() => toggleArrayFilter('jobType', 'long_form')}
            />
            <FilterCheckbox
              label="Motion graphics"
              checked={filters.jobType.includes('motion_graphics')}
              onChange={() => toggleArrayFilter('jobType', 'motion_graphics')}
            />
          </div>
        </div>

        {/* Payment */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Payment</label>
          <FilterCheckbox
            label="Paid only"
            checked={filters.payment.includes('paid')}
            onChange={() => toggleArrayFilter('payment', 'paid')}
            color="green"
          />
        </div>

        {/* Posted Within */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Posted within</label>
          <div className="space-y-2">
            <RadioButton
              label="Last 10 mins"
              checked={filters.postedWithin === 'last_10_mins'}
              onChange={() => handleFilterChange('postedWithin', 'last_10_mins')}
            />
            <RadioButton
              label="Last hour"
              checked={filters.postedWithin === 'last_hour'}
              onChange={() => handleFilterChange('postedWithin', 'last_hour')}
            />
          </div>
        </div>

        {/* Keywords */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Keywords</label>
          <input
            type="text"
            value={filters.keywords}
            onChange={(e) => handleFilterChange('keywords', e.target.value)}
            placeholder="Enter keywords..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Apply Button */}
        <button className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors">
          Apply Filters
        </button>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
        <button className="flex items-center gap-3 w-full text-left py-3 hover:bg-gray-50 rounded-lg px-3 transition-colors">
          <span className="text-blue-600">🔔</span>
          <div>
            <div className="font-medium text-gray-900">Manage Alerts</div>
            <div className="text-xs text-green-600">You're getting notified instantly ✅</div>
          </div>
        </button>
      </div>
    </div>
  );
}

// Helper Components
interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  color?: string;
}

function FilterCheckbox({ label, checked, onChange, color = 'gray' }: FilterCheckboxProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className={`relative w-5 h-5 rounded ${checked ? `bg-${color}-500` : 'bg-gray-200'} flex items-center justify-center transition-colors`}>
        {checked && <span className="text-white text-xs">✓</span>}
      </div>
      <span className="text-gray-700 group-hover:text-gray-900">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}

interface RadioButtonProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function RadioButton({ label, checked, onChange }: RadioButtonProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className={`w-5 h-5 rounded-full border-2 ${checked ? 'border-green-500' : 'border-gray-300'} flex items-center justify-center`}>
        {checked && <div className="w-3 h-3 rounded-full bg-green-500"></div>}
      </div>
      <span className="text-gray-700 group-hover:text-gray-900">{label}</span>
      <input type="radio" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}
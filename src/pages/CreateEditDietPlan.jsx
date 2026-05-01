import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getUsers, getMeals, createDietPlan, updateDietPlan } from '../api/dietPlans';

// Custom Dropdown Component
function CustomDropdown({ label, value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find selected option - handle both string and number values
  const selectedOption = options.find(opt => {
    const optValue = typeof opt.value === 'number' ? opt.value : String(opt.value);
    const compareValue = typeof value === 'number' ? value : String(value);
    return optValue === compareValue;
  });

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm bg-white text-left flex items-center justify-between hover:border-orange-400 transition-colors"
        >
          <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No options available</div>
            ) : (
              options.map((option) => {
                const optValue = typeof option.value === 'number' ? option.value : String(option.value);
                const compareValue = typeof value === 'number' ? value : String(value);
                const isSelected = optValue === compareValue;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50 transition-colors ${
                      isSelected
                        ? 'bg-orange-100 text-[#F97316] font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateEditDietPlan({ planId = null, onBack }) {
  const [users, setUsers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [weekStartDate, setWeekStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Draft');
  const [aiRetraining, setAiRetraining] = useState(false);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const [activeDay, setActiveDay] = useState(0);
  const [mealPlan, setMealPlan] = useState({
    Monday: { Breakfast: null, Lunch: null, Dinner: null, Snacks: null },
    Tuesday: { Breakfast: null, Lunch: null, Dinner: null, Snacks: null },
    Wednesday: { Breakfast: null, Lunch: null, Dinner: null, Snacks: null },
    Thursday: { Breakfast: null, Lunch: null, Dinner: null, Snacks: null },
    Friday: { Breakfast: null, Lunch: null, Dinner: null, Snacks: null },
    Saturday: { Breakfast: null, Lunch: null, Dinner: null, Snacks: null },
    Sunday: { Breakfast: null, Lunch: null, Dinner: null, Snacks: null },
  });

  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [newMeal, setNewMeal] = useState({
    meal_name: '',
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchMeals();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      const usersArray = Array.isArray(data) ? data : (data?.results ? data.results : []);
      setUsers(usersArray);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchMeals = async () => {
    try {
      const data = await getMeals();
      const mealsArray = Array.isArray(data) ? data : (data?.results ? data.results : []);
      setMeals(mealsArray);
    } catch (error) {
      console.error('Error fetching meals:', error);
      setMeals([]);
    }
  };

  const handleSelectMeal = (day, mealType, meal) => {
    setMealPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: meal
      }
    }));
  };

  const calculateDayTotals = (day) => {
    const dayMeals = mealPlan[day];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    Object.values(dayMeals).forEach(meal => {
      if (meal) {
        totalCalories += meal.calories || 0;
        totalProtein += meal.protein || 0;
        totalCarbs += meal.carbohydrates || 0;
        totalFat += meal.fat || 0;
      }
    });

    return { totalCalories, totalProtein, totalCarbs, totalFat };
  };

  const calculateWeeklyTotals = () => {
    let weekCalories = 0;
    let weekProtein = 0;
    let weekCarbs = 0;
    let weekFat = 0;

    days.forEach(day => {
      const { totalCalories, totalProtein, totalCarbs, totalFat } = calculateDayTotals(day);
      weekCalories += totalCalories;
      weekProtein += totalProtein;
      weekCarbs += totalCarbs;
      weekFat += totalFat;
    });

    return {
      avgCalories: Math.round(weekCalories / 7),
      avgProtein: Math.round(weekProtein / 7),
      avgCarbs: Math.round(weekCarbs / 7),
      avgFat: Math.round(weekFat / 7),
    };
  };

  const getChartData = () => {
    return days.map(day => ({
      name: day.slice(0, 3),
      calories: calculateDayTotals(day).totalCalories,
    }));
  };

  const getMacroData = () => {
    const totals = calculateWeeklyTotals();
    return [
      { name: 'Protein', value: totals.avgProtein, fill: '#ef4444' },
      { name: 'Carbs', value: totals.avgCarbs, fill: '#f97316' },
      { name: 'Fat', value: totals.avgFat, fill: '#9ca3af' },
    ];
  };

  const handleSavePlan = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const planData = {
        user_id: selectedUser?.id,
        for_week_starting: weekStartDate,
        status: status,
        meals: mealPlan,
        nutritionist_comment: comments,
        approved_for_retraining: aiRetraining,
        created_at: now,
        updated_at: now,
      };

      if (planId) {
        await updateDietPlan(planId, planData);
      } else {
        await createDietPlan(planData);
      }

      onBack?.();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Error saving plan: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const currentDay = days[activeDay];
  const dayTotals = calculateDayTotals(currentDay);
  const weeklyTotals = calculateWeeklyTotals();

  return (
    <div className="p-6 space-y-6 bg-[#fafafa] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-lg transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {planId ? 'Edit Diet Plan' : 'Create New Diet Plan'}
          </h1>
          <p className="text-sm text-gray-600 font-medium opacity-80 mt-1">
            {planId ? 'Update the diet plan details' : 'Create a personalized diet plan for a user'}
          </p>
        </div>
      </div>

      {/* Section 1: Plan Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Plan Info</h2>
        
        <div className="space-y-4">
          {/* User Selection */}
          <div>
            <CustomDropdown
              label="Select Client"
              value={selectedUser?.id || ''}
              onChange={(userId) => {
                if (userId) {
                  const user = users.find(u => u.id === parseInt(userId));
                  setSelectedUser(user);
                } else {
                  setSelectedUser(null);
                }
              }}
              options={users.map(user => ({
                value: user.id,
                label: user.full_name || user.username
              }))}
              placeholder="Choose a client..."
            />
          </div>

          {/* User Health Profile */}
          {selectedUser && (
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#F97316] text-white flex items-center justify-center font-bold">
                  {(selectedUser.full_name || selectedUser.username).charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedUser.full_name || selectedUser.username}</p>
                  <p className="text-xs text-gray-600">ID: {selectedUser.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Age</p>
                  <p className="font-semibold text-gray-900">28</p>
                </div>
                <div>
                  <p className="text-gray-600">Weight</p>
                  <p className="font-semibold text-gray-900">75kg</p>
                </div>
                <div>
                  <p className="text-gray-600">Goal</p>
                  <p className="font-semibold text-gray-900">Weight Loss</p>
                </div>
              </div>
            </div>
          )}

          {/* Date and Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Week Starting</label>
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
            />
          </div>

          {/* AI Retraining */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 flex items-start gap-3">
            <input
              type="checkbox"
              checked={aiRetraining}
              onChange={(e) => setAiRetraining(e.target.checked)}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-gray-900">AI Retraining</p>
              <p className="text-sm text-gray-600">Optimize plan based on client's previous adherence data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: 7-Day Meal Builder - COMMENTED OUT FOR NOW */}
      {/* 
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">7-Day Meal Builder</h2>
          <button className="px-4 py-2 border border-[#F97316] text-[#F97316] rounded-lg font-semibold hover:bg-orange-50 text-sm transition-colors">
            Auto-fill Week
          </button>
        </div>

        {/* Day Tabs */}
        {/* <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {days.map((day, idx) => (
            <button
              key={day}
              onClick={() => setActiveDay(idx)}
              className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors ${
                activeDay === idx
                  ? 'bg-[#F97316] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Meal Slots */}
        {/* <div className="space-y-4 mb-6">
          {mealTypes.map(mealType => (
            <div key={mealType} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900">{mealType}</p>
                <p className="text-sm font-semibold text-[#F97316]">
                  {mealPlan[currentDay][mealType]?.calories || 0} kcal
                </p>
              </div>

              {/* Selected Meal or Add Button */}
        {/* {mealPlan[currentDay][mealType] ? (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{mealPlan[currentDay][mealType].meal_name}</p>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                        <div>
                          <p className="text-gray-600">Protein</p>
                          <p className="font-semibold text-red-600">{mealPlan[currentDay][mealType].protein}g</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Carbs</p>
                          <p className="font-semibold text-blue-600">{mealPlan[currentDay][mealType].carbohydrates}g</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Fat</p>
                          <p className="font-semibold text-yellow-600">{mealPlan[currentDay][mealType].fat}g</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMealType(mealType);
                        setShowMealModal(true);
                      }}
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors font-semibold"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedMealType(mealType);
                    setShowMealModal(true);
                  }}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-semibold hover:border-[#F97316] hover:text-[#F97316] transition-colors text-sm"
                >
                  + Add {mealType}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Daily Totals */}
        {/* <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg p-4">
          <p className="font-semibold mb-3">{currentDay}'s Totals</p>
          <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
            <div>
              <p className="text-gray-300">Calories</p>
              <p className="font-bold text-lg">{dayTotals.totalCalories}</p>
            </div>
            <div>
              <p className="text-red-300">Protein</p>
              <p className="font-bold text-lg text-red-400">{dayTotals.totalProtein}g</p>
            </div>
            <div>
              <p className="text-blue-300">Carbs</p>
              <p className="font-bold text-lg text-blue-400">{dayTotals.totalCarbs}g</p>
            </div>
            <div>
              <p className="text-yellow-300">Fat</p>
              <p className="font-bold text-lg text-yellow-400">{dayTotals.totalFat}g</p>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden flex">
            <div className="h-full bg-red-500" style={{ width: '40%' }} />
            <div className="h-full bg-blue-500" style={{ width: '45%' }} />
            <div className="h-full bg-yellow-500" style={{ width: '15%' }} />
          </div>
        </div>
      </div>
      */}

      {/* Section 3: Weekly Summary - COMMENTED OUT FOR NOW */}
      {/*
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Summary</h2>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Bar Chart */}
        {/* <ResponsiveContainer width="100%" height={250}>
            <BarChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="calories" fill="#F97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Pie Chart */}
        {/* <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getMacroData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {getMacroData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Stats */}
        {/* <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center border border-orange-200">
            <p className="text-gray-600 text-sm font-medium">Avg Daily Calories</p>
            <p className="text-2xl font-bold text-[#F97316] mt-2">{weeklyTotals.avgCalories}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 text-center border border-red-200">
            <p className="text-gray-600 text-sm font-medium">Avg Protein</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{weeklyTotals.avgProtein}g</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
            <p className="text-gray-600 text-sm font-medium">Avg Carbs</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{weeklyTotals.avgCarbs}g</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center border border-yellow-200">
            <p className="text-gray-600 text-sm font-medium">Avg Fat</p>
            <p className="text-2xl font-bold text-yellow-600 mt-2">{weeklyTotals.avgFat}g</p>
          </div>
        </div>
      </div>
      */}

      {/* Section 4: Nutritionist Comments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Nutritionist Comments</h2>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add notes, hydration tips, or cooking instructions..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none text-sm"
          rows={4}
        />
      </div>

      {/* Section 5: Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
        >
          Cancel
        </button>
        <button className="flex-1 px-4 py-3 border border-[#F97316] text-[#F97316] rounded-lg font-semibold hover:bg-orange-50 transition-colors text-sm">
          Preview
        </button>
        <button
          onClick={handleSavePlan}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm"
        >
          {loading ? 'Saving...' : 'Save & Publish'}
        </button>
      </div>

      {/* Meal Creation Modal - COMMENTED OUT FOR NOW */}
      {/* {showMealModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
        {/* <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0">
              <h3 className="text-xl font-bold text-gray-900">Create New {selectedMealType}</h3>
              <button
                onClick={() => {
                  setShowMealModal(false);
                  setNewMeal({ meal_name: '', calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content - Meal Creation Form */}
        {/* <div className="p-6 space-y-4">
              {/* Meal Name */}
        {/* <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Name</label>
                <input
                  type="text"
                  value={newMeal.meal_name}
                  onChange={(e) => setNewMeal({ ...newMeal, meal_name: e.target.value })}
                  placeholder="e.g., Grilled Chicken with Rice"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                />
              </div>

              {/* Calories */}
        {/* <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Calories (kcal)</label>
                <input
                  type="number"
                  value={newMeal.calories}
                  onChange={(e) => setNewMeal({ ...newMeal, calories: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                />
              </div>

              {/* Macronutrients */}
        {/* <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Protein (g)</label>
                  <input
                    type="number"
                    value={newMeal.protein}
                    onChange={(e) => setNewMeal({ ...newMeal, protein: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Carbs (g)</label>
                  <input
                    type="number"
                    value={newMeal.carbohydrates}
                    onChange={(e) => setNewMeal({ ...newMeal, carbohydrates: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fat (g)</label>
                  <input
                    type="number"
                    value={newMeal.fat}
                    onChange={(e) => setNewMeal({ ...newMeal, fat: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm"
                  />
                </div>
              </div>

              {/* Preview */}
        {/* {newMeal.meal_name && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <p className="text-sm font-semibold text-gray-900 mb-2">{newMeal.meal_name}</p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-gray-600">Calories</p>
                      <p className="font-semibold text-orange-600">{newMeal.calories} kcal</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Protein</p>
                      <p className="font-semibold text-red-600">{newMeal.protein}g</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Carbs</p>
                      <p className="font-semibold text-blue-600">{newMeal.carbohydrates}g</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Fat</p>
                      <p className="font-semibold text-yellow-600">{newMeal.fat}g</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
        {/* <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowMealModal(false);
                    setNewMeal({ meal_name: '', calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newMeal.meal_name.trim()) {
                      handleSelectMeal(currentDay, selectedMealType, newMeal);
                      setShowMealModal(false);
                      setNewMeal({ meal_name: '', calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
                    }
                  }}
                  disabled={!newMeal.meal_name.trim()}
                  className="flex-1 px-4 py-2 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm"
                >
                  Add Meal
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}

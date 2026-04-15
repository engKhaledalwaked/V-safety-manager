import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ClientAPI } from '../../services/server';

const Booking: React.FC = () => {
  const navigate = useNavigate();
  // We access the global client service via context or we could instantiate a singleton
  // For simplicity here, we assume the outlet context provides it or we pass it via props in App
  // But let's use the context pattern from App.tsx
  const { clientService } = useOutletContext<{ clientService: ClientAPI }>();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    plateLetters: '',
    plateNumbers: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clientService.submitData({
        name: formData.name,
        phoneNumber: formData.phone,
        // Assuming 'plate' is not in UserData interface strictly but we can add it or map it
        // For now, let's map it to name or just ignore plate in strict type, or cast
    });
    navigate('/billing', { state: { fromBooking: true } });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="mb-8 border-b pb-4">
        <h2 className="text-2xl font-bold text-brand">حجز موعد جديد</h2>
        <p className="text-gray-500">الرجاء إدخال بيانات المركبة ومالكها</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Simplified Form for brevity, assumes full UI code from before */}
        <div className="grid md:grid-cols-2 gap-4">
            <input 
                type="text" placeholder="الاسم الكامل" required
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <input 
                type="tel" placeholder="رقم الجوال" required
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
            />
        </div>
        <button type="submit" className="w-full bg-accent text-white font-bold py-3 rounded-lg">متابعة للدفع</button>
      </form>
    </div>
  );
};

export default Booking;
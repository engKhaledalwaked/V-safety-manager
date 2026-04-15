import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ClientAPI } from '../../services/server';

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { clientService } = useOutletContext<{ clientService: ClientAPI }>();
  
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clientService.submitPayment({
        cardNumber: cardData.number,
        cardHolderName: cardData.name,
        expirationDate: cardData.expiry,
        cvv: cardData.cvv
    });
    navigate('/verification');
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-xl font-bold mb-6 text-brand">بيانات البطاقة</h2>
        <form onSubmit={handleCardSubmit} className="space-y-4">
            <input type="text" className="w-full p-3 border rounded-lg" placeholder="رقم البطاقة" value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
                <input type="text" className="w-full p-3 border rounded-lg" placeholder="MM/YY" value={cardData.expiry} onChange={e => setCardData({...cardData, expiry: e.target.value})} required />
                <input type="password" className="w-full p-3 border rounded-lg" placeholder="CVV" value={cardData.cvv} onChange={e => setCardData({...cardData, cvv: e.target.value})} required />
            </div>
            <button type="submit" className="w-full bg-accent text-white font-bold py-3 rounded-lg shadow mt-4">دفع 115.00 ر.س</button>
        </form>
    </div>
  );
};

export default Payment;
'use client';

import { Phone, AlertCircle, Shield, Ambulance, Flame, Users, AlertTriangle } from 'lucide-react';

interface EmergencyContact {
  name: string;
  number: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: 'Police',
    number: '19',
    icon: <Shield size={24} className="text-white" />,
    color: '#3b82f6',
    description: 'Police Nationale',
  },
  {
    name: 'Ambulance',
    number: '15',
    icon: <Ambulance size={24} className="text-white" />,
    color: '#ef4444',
    description: 'Service médical d\'urgence',
  },
  {
    name: 'Fire Department',
    number: '15',
    icon: <Flame size={24} className="text-white" />,
    color: '#f97316',
    description: 'Pompiers',
  },
  {
    name: 'Gendarmerie',
    number: '177',
    icon: <Shield size={24} className="text-white" />,
    color: '#6366f1',
    description: 'Gendarmerie Royale',
  },
  {
    name: 'Civil Protection',
    number: '15',
    icon: <AlertTriangle size={24} className="text-white" />,
    color: '#eab308',
    description: 'Protection civile',
  },
  {
    name: 'Tourist Police',
    number: '0537-27-27-27',
    icon: <Users size={24} className="text-white" />,
    color: '#8b5cf6',
    description: 'Police touristique',
  },
];

export default function EmergencyPage() {
  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-red-500 to-orange-600 px-6 pt-12 pb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30">
            <AlertCircle size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Emergency Contacts</h2>
            <p className="text-white/80 text-sm">Morocco - Contacts d'urgence</p>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {EMERGENCY_CONTACTS.map((contact, index) => (
          <button
            key={index}
            onClick={() => handleCall(contact.number)}
            className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-left active:scale-95"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{ backgroundColor: contact.color }}
            >
              {contact.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg text-gray-700 mb-1">{contact.name}</div>
              <div className="text-sm text-gray-500 mb-2">{contact.description}</div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-blue-500" />
                <span className="text-xl font-bold text-blue-600">{contact.number}</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <Phone size={20} className="text-white" />
              </div>
            </div>
          </button>
        ))}

        {/* Important Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-900 mb-1">Important Notice</div>
              <p className="text-sm text-yellow-800">
                In case of emergency, call the appropriate number immediately. 
                For medical emergencies, dial 15. For police assistance, dial 19.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

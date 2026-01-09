import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import BookAppointment from '../components/BookAppointment';
import MyAppointments from '../components/MyAppointments';
import SpeechToText from '../components/SpeechToText';
import { Calendar, Mic, User } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('my-appointments');

  const tabs = [
   // { id: 'appointments', label: 'Book Appointment', icon: Calendar },
    { id: 'my-appointments', label: 'My Appointments', icon: User },
    { id: 'speech', label: 'Book Appointment - Voice Assistant', icon: Mic },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'appointments':
        return <BookAppointment />;
      case 'my-appointments':
        return <MyAppointments />;
      case 'speech':
        return <SpeechToText />;
      default:
        return <BookAppointment />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏥 Doctor Appointment System
              </h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.username}!</p>
            </div>
            <Button 
              onClick={logout} 
              variant="outline"
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

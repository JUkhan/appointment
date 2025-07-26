import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CalendarDays, Clock, User } from 'lucide-react';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/doctors');
      setDoctors(response.data);
    } catch (error) {
      setError('Failed to fetch doctors');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const dateTime = `${appointmentDate} ${appointmentTime}`;

    try {
      console.log('Booking appointment with data:', {
        doctor_id: parseInt(selectedDoctor),
        date: dateTime
      });
      
      console.log('Current axios headers:', axios.defaults.headers.common);
      
      const response = await axios.post('/appointments', {
        doctor_id: parseInt(selectedDoctor),
        date: dateTime
      });

      console.log('Appointment booking response:', response.data);
      setMessage(`Appointment booked successfully with ${response.data.doctor_name} on ${response.data.date}`);
      setSelectedDoctor('');
      setAppointmentDate('');
      setAppointmentTime('');
    } catch (error) {
      console.error('Appointment booking error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 422) {
        setError('Authentication required. Please login again.');
      } else {
        setError(error.response?.data?.error || 'Failed to book appointment');
      }
    }

    setLoading(false);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarDays className="w-5 h-5" />
          <span>Book New Appointment</span>
        </CardTitle>
        <CardDescription>
          Select a doctor and preferred time for your appointment
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="doctor">Select Doctor</Label>
            <select
              id="doctor"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Choose a doctor...</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.availability}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Appointment Date</Label>
              <Input
                id="date"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={today}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="time">Appointment Time</Label>
              <Input
                id="time"
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </Button>
        </form>

        {/* Available Doctors */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Available Doctors</span>
          </h3>
          <div className="grid gap-4">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <h4 className="font-medium">{doctor.name}</h4>
                <p className="text-sm text-gray-600 flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{doctor.availability}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookAppointment;

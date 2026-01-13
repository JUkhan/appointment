import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CalendarDays, Clock, User, Search } from 'lucide-react';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  //const [appointmentTime, setAppointmentTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({
    patientName: '',
    patientAge: '',
  });

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

  const filteredDoctors = doctors.filter((doctor) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const nameMatch = doctor.name.toLowerCase().includes(query);
    const specializationMatch = doctor.specialization?.toLowerCase().includes(query);

    return nameMatch || specializationMatch;
  }).slice(0, 5); // Limit to 5 results

  const validateForm = () => {
    const newErrors = {
      patientName: '',
      patientAge: '',
    };

    let isValid = true;

    if (!patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
      isValid = false;
    }

    if (!patientAge.trim()) {
      newErrors.patientAge = 'Patient age is required';
      isValid = false;
    } else {
      const age = parseInt(patientAge);
      if (isNaN(age) || age <= 0 || age > 150) {
        newErrors.patientAge = 'Please enter a valid age (1-150)';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDoctor) {
      setError('Please select a doctor');
      return;
    }

    // Validate form fields
    if (!validateForm()) {
      setError('Please fill in all required fields correctly.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    //const dateTime = `${appointmentDate} ${appointmentTime}`;

    try {
      console.log('Booking appointment with data:', {
        doctor_id: selectedDoctor.id,
        date: appointmentDate,
        patient_name: patientName.trim(),
        patient_age: parseInt(patientAge),
      });

      const response = await axios.post('/appointments', {
        doctor_id: selectedDoctor.id,
        date: appointmentDate,
        patient_name: patientName.trim(),
        patient_age: parseInt(patientAge),
      });

      console.log('Appointment booking response:', response.data);

      if (response.error) {
        setError(response.data.error);
      } else {
        setMessage(`Appointment booked successfully!\n\nPatient: ${patientName}\nDoctor: ${selectedDoctor.name}\nDate: ${appointmentDate}\nSerial Number: ${response.data.appointment?.serial_number || 'N/A'}`);
        setSelectedDoctor(null);
        setAppointmentDate('');
        //setAppointmentTime('');
        setPatientName('');
        setPatientAge('');
        setErrors({ patientName: '', patientAge: '' });
      }
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Doctors */}
          <div>
            <Label htmlFor="search" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Search Doctors</span>
            </Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by doctor name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Doctor Selection */}
          <div>
            <Label>Select Doctor *</Label>
            <div className="mt-2 grid gap-3 max-h-96 overflow-y-auto">
              {filteredDoctors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {searchQuery ? `No doctors found matching "${searchQuery}"` : 'No doctors available'}
                </p>
              ) : (
                filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{doctor.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{doctor.specialization}</p>
                      </div>
                      {selectedDoctor?.id === doctor.id && (
                        <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-green-600 flex items-center mt-2">
                      <Clock className="w-4 h-4 mr-1" />
                      {doctor.availability}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Appointment Date *</Label>
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

            {/* <div>
              <Label htmlFor="time">Appointment Time *</Label>
              <Input
                id="time"
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
                className="mt-1"
              />
            </div> */}
          </div>

          {/* Patient Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Patient Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input
                  id="patientName"
                  type="text"
                  placeholder="Enter patient name"
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value);
                    if (errors.patientName) {
                      setErrors({ ...errors, patientName: '' });
                    }
                  }}
                  className={`mt-1 ${errors.patientName ? 'border-red-500' : ''}`}
                  required
                />
                {errors.patientName && (
                  <p className="text-red-500 text-sm mt-1">{errors.patientName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="patientAge">Patient Age *</Label>
                <Input
                  id="patientAge"
                  type="number"
                  placeholder="Enter patient age"
                  value={patientAge}
                  onChange={(e) => {
                    setPatientAge(e.target.value);
                    if (errors.patientAge) {
                      setErrors({ ...errors, patientAge: '' });
                    }
                  }}
                  min="1"
                  max="150"
                  className={`mt-1 ${errors.patientAge ? 'border-red-500' : ''}`}
                  required
                />
                {errors.patientAge && (
                  <p className="text-red-500 text-sm mt-1">{errors.patientAge}</p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !selectedDoctor || !patientName.trim() || !patientAge.trim()}
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookAppointment;

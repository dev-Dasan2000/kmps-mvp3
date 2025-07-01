"use client";
import React, { useContext, useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Phone, Mail, MapPin, User, Calendar, Droplets, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Patient = {
  patient_id: string;
  hospital_patient_id: string;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  NIC: string;
  blood_group: string;
  date_of_birth: string;
  gender: string;
  password: string;
  profile_picture: string;
};

const PatientManagement = () => {

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const {isLoadingAuth, isLoggedIn, user} = useContext(AuthContext);

  const [loadingPatient, setLoadingPatient] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([
    {
      hospital_patient_id: '',
      patient_id: '',
      password: '',
      name: '',
      profile_picture: '',
      email: '',
      phone_number: '',
      address: '',
      NIC: '',
      blood_group: '',
      date_of_birth: '',
      gender: '',
    }
  ]);

  const [showOverlay, setShowOverlay] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<Patient>({
    hospital_patient_id: '',
    patient_id: '',
    password: '',
    name: '',
    profile_picture: '',
    email: '',
    phone_number: '',
    address: '',
    NIC: '',
    blood_group: '',
    date_of_birth: '',
    gender: '',
  });

  const [searchTerm, setSearchTerm] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];

  const resetForm = () => {
    setFormData({
      hospital_patient_id: '',
      patient_id: '',
      password: '',
      name: '',
      profile_picture: '',
      email: '',
      phone_number: '',
      address: '',
      NIC: '',
      blood_group: '',
      date_of_birth: '',
      gender: '',
    });
  };

  const handleAddPatient = () => {
    setEditingPatient(null);
    resetForm();
    setShowOverlay(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({ ...patient });
    setShowOverlay(true);
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setEditingPatient(null);
    resetForm();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name || !formData.email) {
     toast.error("Please fill in all required fields");
      return;
    }

    if (editingPatient) {
      try{
        const response = await axios.put(
          `${backendURL}/patients/${editingPatient.patient_id}`,
          {
            name: formData.name,
            profile_picture: formData.profile_picture,
            email: formData.email,
            phone_number: formData.phone_number,
            address: formData.address,
            nic: formData.NIC,
            blood_group: formData.blood_group,
            date_of_birth: formData.date_of_birth,
            gender: formData.gender
          },
          {
            withCredentials: true,
            headers: {
              "Content-type":"application/json"
            }
          }
        );
        if(response.status != 202){
          throw new Error("Error updating patient");
        }
        toast.success("Patient updated successfully");
      }
      catch(err: any){
        toast.error("Error updating patient");
      }
      finally{

      }
      // Update existing patient
      setPatients(prev =>
        prev?.map(patient =>
          patient.patient_id === editingPatient.patient_id
            ? { ...formData }
            : patient
        )
      );
    } else {
      // Add new patient
      const newPatientId = `P${String(patients.length + 1).padStart(3, '0')}`;
      try {
        const response = await axios.post(
          `${backendURL}/patients`, {
          hospital_patient_id: formData.hospital_patient_id,
          patient_id: newPatientId,
          name: formData.name,
          profile_picture: formData.profile_picture,
          email: formData.email,
          phone_number: formData.phone_number,
          address: formData.address,
          nic: formData.NIC,
          blood_group: formData.blood_group,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
        },
        {
          withCredentials: true,
          headers:{
            "Content-type":"application/json"
          }
        }
        );
        if(response.status != 201){
          throw new Error("Error Creating Patient");
        }
        else{
          toast.success("Patient created successfully");
          setPatients(prev => [...prev, { ...formData, patient_id: newPatientId }]);
        }
      }
      catch (err: any) {
        toast.error("Error Creating Patient");
      }
      finally {

      }
    }

    handleCloseOverlay();
  };

  const handleDeletePatient = async (patientId: string) => {
    try {
      const response = await axios.delete(
        `${backendURL}/patients/${patientId}`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setPatients(prev => prev.filter(patient => patient.patient_id !== patientId));
    }
    catch (err: any) {
     toast.error("Error deleting patient");
    }
    finally {

    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone_number.includes(searchTerm) ||
    patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  };

  const fetchPatients = async () => {
    setLoadingPatient(true);
    try {
      const response = await axios.get(
        `${backendURL}/patients`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setPatients(response.data);
    }
    catch (err: any) {
      toast.error("Error fetching patients");
    }
    finally {
      setLoadingPatient(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(()=>{
    if(!isLoadingAuth){
      if(!isLoggedIn){
        toast.error("Session Error", {
          description: "Your session is expired, please login again"
        });
        router.push("/");
      }
      else if(user.role != "admin"){
        toast.error("Access Error", {
          description: "You do not have access, redirecting..."
        });
        router.push("/");
      }
    }
  },[isLoadingAuth]);


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl mt-7 md:mt-0 font-bold text-gray-900">Patients</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">View Patients database entries</p>
          </div>
          <Button
            onClick={handleAddPatient}
            className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus size={20} />
            Add Patient
          </Button>
        </div>

        {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg   focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-50 px-6 py-3 border-b border-green-200">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
              <div>Profile</div>
              <div>Patient ID</div>
              <div>Name</div>
              <div>Address</div>
              <div>Email</div>
              <div>Action</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <div key={patient.patient_id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center text-gray-700 font-medium">
                      {patient.profile_picture ? (
                        <img
                          src={`${backendURL}/${patient.profile_picture}`}
                          alt={patient.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(patient.name)
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-900">{patient.patient_id}</div>
                  <div className="text-sm text-gray-900">{patient.name}</div>
                  <div className="text-sm text-gray-600">{patient.address}</div>
                  <div className="text-sm text-gray-600">{patient.email}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPatient(patient)}
                      className="p-1 h-8 w-8"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { toast.success("Patient deleted successfully");
                         handleDeletePatient(patient.patient_id) }}
                      className="p-1 h-8 w-8 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredPatients.map((patient) => (
            <div key={patient.patient_id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-medium text-lg">
                    {getInitials(patient.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                    <p className="text-sm text-gray-500">{patient.patient_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPatient(patient)}
                    className="p-2 h-8 w-8"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePatient(patient.patient_id)}
                    className="p-2 h-8 w-8 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={16} />
                  <span>{patient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={16} />
                  <span>{patient.phone_number}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{patient.address}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={16} />
                    <span>{patient.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Droplets size={16} />
                    <span>{patient.blood_group}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>{patient.date_of_birth}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overlay Form */}
        {showOverlay && (
          <Dialog open={showOverlay} onOpenChange={setShowOverlay}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingPatient ? 'Edit Patient' : 'Add New Patient'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hospital_patient_id" className="text-sm font-medium">Hospital Patient ID</Label>
                    <Input
                      id="hospital_patient_id"
                      name="hospital_patient_id"
                      value={formData.hospital_patient_id}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>

                 {/* <div className="space-y-2">
                    <Label htmlFor="patient_id" className="text-sm font-medium">Patient ID</Label>
                    <Input
                      id="patient_id"
                      name="patient_id"
                      value={formData.patient_id}
                      onChange={handleInputChange}
                      disabled={editingPatient ? true : false}
                      className="w-full"
                    />
                  </div>*/}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="NIC" className="text-sm font-medium">NIC</Label>
                    <Input
                      id="NIC"
                      name="NIC"
                      value={formData.NIC}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blood_group" className="text-sm font-medium">Blood Group</Label>
                    <Select
                      value={formData.blood_group}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, blood_group: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Blood Group" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map(group => (
                          <SelectItem key={group} value={group}>{group}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="text-sm font-medium">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genders.map(gender => (
                          <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

               {/* <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_picture" className="text-sm font-medium">Profile Picture URL</Label>
                  <Input
                    id="profile_picture"
                    type="url"
                    name="profile_picture"
                    value={formData.profile_picture}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>*/}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseOverlay}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  >
                    {editingPatient ? 'Update Patient' : 'Add Patient'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default PatientManagement;
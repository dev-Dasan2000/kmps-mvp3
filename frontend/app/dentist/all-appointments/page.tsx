import DentistCalendarView from '@/components/DentistCalendarView';

const AllAppointmentsPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dentist Appointments</h1>
      <DentistCalendarView />
    </div>
  );
};

export default AllAppointmentsPage;
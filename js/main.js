(function(){
  const STORAGE = {
    doctors: 'hospital_doctors',
    patients: 'hospital_patients',
    appointments: 'hospital_appointments',
    user: 'hospital_current_user'
  };

  const seedDoctors = [
    {id:'d1',name:'Dr. Sarah Williams',specialization:'Cardiologist',department:'Cardiology',experience:12,rating:4.9,availability:'Weekdays',status:'Available',fee:120,qualification:'MBBS, MD, DM Cardiology',education:'Johns Hopkins Hospital',bio:'Interventional cardiologist focused on preventive heart care and high-risk cases.',slots:['09:00 AM','10:30 AM','02:00 PM','04:00 PM']},
    {id:'d2',name:'Dr. Arjun Mehta',specialization:'Neurologist',department:'Neurology',experience:10,rating:4.8,availability:'Weekdays',status:'Available',fee:140,qualification:'MBBS, MD Neurology',education:'AIIMS',bio:'Neurology consultant with expertise in stroke care, migraines, and neuropathy.',slots:['10:00 AM','11:30 AM','03:00 PM','05:00 PM']},
    {id:'d3',name:'Dr. Emily Chen',specialization:'Orthopedic Surgeon',department:'Orthopedics',experience:15,rating:4.7,availability:'Weekend',status:'Available',fee:150,qualification:'MBBS, MS Orthopedics',education:'Mayo Clinic',bio:'Surgical and non-surgical bone, joint, and sports injury management.',slots:['09:30 AM','12:00 PM','02:30 PM','05:30 PM']},
    {id:'d4',name:'Dr. Rahul Verma',specialization:'Pediatrician',department:'Pediatrics',experience:9,rating:4.9,availability:'Available Today',status:'Available',fee:90,qualification:'MBBS, MD Pediatrics',education:'KEM Hospital',bio:'Child healthcare specialist for preventive, acute, and developmental needs.',slots:['09:15 AM','11:00 AM','01:30 PM','04:30 PM']},
    {id:'d5',name:'Dr. Aisha Khan',specialization:'Radiologist',department:'Radiology',experience:11,rating:4.6,availability:'Weekdays',status:'Available',fee:110,qualification:'MBBS, MD Radiodiagnosis',education:'Apollo Institutes',bio:'Diagnostic imaging specialist for X-ray, CT, MRI, and ultrasound interpretation.',slots:['08:30 AM','11:00 AM','01:00 PM','03:30 PM']},
    {id:'d6',name:'Dr. Michael Brown',specialization:'Dermatologist',department:'Dermatology',experience:8,rating:4.7,availability:'Available Today',status:'Available',fee:100,qualification:'MBBS, MD Dermatology',education:'Stanford Medicine',bio:'Clinical and cosmetic dermatology with emphasis on skin health and clarity.',slots:['10:00 AM','12:30 PM','03:00 PM','06:00 PM']},
    {id:'d7',name:'Dr. Priya Nair',specialization:'Internal Medicine',department:'Internal Medicine',experience:14,rating:4.8,availability:'Weekdays',status:'Available',fee:95,qualification:'MBBS, MD Internal Medicine',education:'CMC Vellore',bio:'General physician handling chronic conditions, screenings, and follow-up care.',slots:['08:45 AM','10:15 AM','01:15 PM','04:15 PM']},
    {id:'d8',name:'Dr. Daniel Scott',specialization:'ENT Specialist',department:'ENT',experience:13,rating:4.5,availability:'Weekend',status:'Available',fee:105,qualification:'MBBS, MS ENT',education:'University Hospital London',bio:'Ear, nose, and throat consultations with minor procedure support.',slots:['09:00 AM','11:15 AM','02:15 PM','05:00 PM']}
  ];

  const seedPatients = [
    {id:'p1',name:'John Carter',age:38,gender:'Male',phone:'555-0101',email:'patient@demo.com',password:'demo123',bloodGroup:'O+',allergies:'None',memberSince:'2025-03-14'},
    {id:'p2',name:'Nina Patel',age:29,gender:'Female',phone:'555-0102',email:'nina@demo.com',password:'demo123',bloodGroup:'B+',allergies:'Penicillin',memberSince:'2025-05-02'}
  ];

  const seedAppointments = [
    {id:'a1',patientId:'p1',patientName:'John Carter',patientEmail:'patient@demo.com',patientPhone:'555-0101',doctorId:'d1',doctorName:'Dr. Sarah Williams',department:'Cardiology',date:getDateString(1),time:'10:30 AM',reason:'Recurring chest discomfort and checkup.',status:'Upcoming',type:'In-person',createdAt:getDateString(0)},
    {id:'a2',patientId:'p1',patientName:'John Carter',patientEmail:'patient@demo.com',patientPhone:'555-0101',doctorId:'d4',doctorName:'Dr. Rahul Verma',department:'Pediatrics',date:getDateString(-16),time:'11:00 AM',reason:'Appointment for child fever follow-up.',status:'Completed',type:'In-person',createdAt:getDateString(-20)},
    {id:'a3',patientId:'p2',patientName:'Nina Patel',patientEmail:'nina@demo.com',patientPhone:'555-0102',doctorId:'d6',doctorName:'Dr. Michael Brown',department:'Dermatology',date:getDateString(2),time:'03:00 PM',reason:'Skin rash evaluation.',status:'Pending',type:'In-person',createdAt:getDateString(0)}
  ];

  function getDateString(offsetDays = 0){
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function read(key, fallback){
    const raw = localStorage.getItem(key);
    if(raw) return JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(fallback));
    return JSON.parse(JSON.stringify(fallback));
  }

  function save(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ensureSeed(){
    read(STORAGE.doctors, seedDoctors);
    read(STORAGE.patients, seedPatients);
    read(STORAGE.appointments, seedAppointments);
    if(!localStorage.getItem(STORAGE.user)){
      const demoUser = {role:'patient',email:'patient@demo.com',name:'John Carter',patientId:'p1'};
      save(STORAGE.user, demoUser);
    }
  }

  function getDoctors(){ return read(STORAGE.doctors, seedDoctors); }
  function getPatients(){ return read(STORAGE.patients, seedPatients); }
  function getAppointments(){ return read(STORAGE.appointments, seedAppointments); }
  function getCurrentUser(){ return localStorage.getItem(STORAGE.user) ? JSON.parse(localStorage.getItem(STORAGE.user)) : null; }

  function saveDoctors(list){ save(STORAGE.doctors, list); }
  function savePatients(list){ save(STORAGE.patients, list); }
  function saveAppointments(list){ save(STORAGE.appointments, list); }
  function setCurrentUser(user){ save(STORAGE.user, user); }
  function clearCurrentUser(){ localStorage.removeItem(STORAGE.user); }

  function findDoctor(id){ return getDoctors().find(d => d.id === id); }
  function findPatient(id){ return getPatients().find(p => p.id === id); }
  function findAppointment(id){ return getAppointments().find(a => a.id === id); }
  function nextAppointmentId(){ return 'a' + Math.random().toString(36).slice(2, 8); }

  function formatDate(iso){
    if(!iso) return '';
    return new Intl.DateTimeFormat('en-US', {month:'short', day:'numeric', year:'numeric'}).format(new Date(iso + 'T00:00:00'));
  }

  function formatTimeSlot(slot){ return slot; }

  function showToast(message, type='primary'){
    const container = document.getElementById('toastContainer');
    if(!container || typeof bootstrap === 'undefined') return;
    const id = 'toast_' + Math.random().toString(36).slice(2,8);
    const iconMap = {primary:'info-circle',success:'check-circle-fill',danger:'exclamation-triangle-fill',warning:'exclamation-circle-fill'};
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.id = id;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body"><i class="bi bi-${iconMap[type] || 'info-circle'} me-2"></i>${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>`;
    container.appendChild(toast);
    const bsToast = bootstrap.Toast.getOrCreateInstance(toast, {delay: 2800});
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
    bsToast.show();
  }

  function getDepartmentOptions(){
    return ['Cardiology','Neurology','Orthopedics','Pediatrics','Radiology','Dermatology','Internal Medicine','ENT'];
  }

  function getAvailableTimesForDoctor(doctorId){
    const doctor = findDoctor(doctorId);
    return doctor ? doctor.slots : [];
  }

  function bookAppointment(payload){
    const list = getAppointments();
    const doctor = findDoctor(payload.doctorId);
    const patient = payload.patientId ? findPatient(payload.patientId) : null;
    const appointment = {
      id: nextAppointmentId(),
      patientId: payload.patientId || patient?.id || null,
      patientName: payload.patientName,
      patientEmail: payload.patientEmail,
      patientPhone: payload.patientPhone,
      doctorId: payload.doctorId,
      doctorName: doctor?.name || payload.doctorName,
      department: payload.department,
      date: payload.date,
      time: payload.time,
      reason: payload.reason,
      status: 'Upcoming',
      type: 'In-person',
      createdAt: getDateString(0)
    };
    list.unshift(appointment);
    saveAppointments(list);
    return appointment;
  }

  function cancelAppointment(id){
    const list = getAppointments().map(a => a.id === id ? {...a, status:'Cancelled'} : a);
    saveAppointments(list);
  }

  function rescheduleAppointment(id, date, time){
    const list = getAppointments().map(a => a.id === id ? {...a, date, time, status:'Upcoming'} : a);
    saveAppointments(list);
  }

  function updateDoctor(id, patch){
    const list = getDoctors().map(d => d.id === id ? {...d, ...patch} : d);
    saveDoctors(list);
  }

  function isToday(iso){
    const today = new Date().toISOString().slice(0,10);
    return iso === today;
  }

  function todayString(){
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function initSessionActions(){
    document.querySelectorAll('#logoutBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        clearCurrentUser();
        showToast('Logged out successfully.', 'success');
        setTimeout(() => window.location.href = 'login.html', 300);
      });
    });
  }

  window.HospitalApp = {
    STORAGE,
    ensureSeed,
    getDoctors,
    getPatients,
    getAppointments,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    findDoctor,
    findPatient,
    findAppointment,
    formatDate,
    formatTimeSlot,
    showToast,
    getDepartmentOptions,
    getAvailableTimesForDoctor,
    bookAppointment,
    cancelAppointment,
    rescheduleAppointment,
    updateDoctor,
    isToday,
    todayString,
    initSessionActions
  };

  document.addEventListener('DOMContentLoaded', () => {
    ensureSeed();
    initSessionActions();
  });
})();

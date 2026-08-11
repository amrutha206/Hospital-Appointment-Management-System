(function(){
  function buildSelectOptions(select, options, placeholder='Select'){
    if(!select) return;
    select.innerHTML = `<option value="">${placeholder}</option>` + options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
  }

  function getInitialDoctor(){
    const params = new URL(window.location.href).searchParams;
    return params.get('doctorId') || '';
  }

  function initAppointmentPage(){
    const form = document.getElementById('appointmentForm');
    if(!form) return;
    document.body.classList.add('page-fade');
    const departmentSelect = document.getElementById('departmentSelect');
    const doctorSelect = document.getElementById('doctorSelect');
    const slotContainer = document.getElementById('slotContainer');
    const selectedTime = document.getElementById('selectedTime');
    const summary = document.getElementById('bookingSummary');
    const dateInput = document.getElementById('appointmentDate');
    const patient = HospitalApp.getCurrentUser()?.role === 'patient' ? HospitalApp.findPatient(HospitalApp.getCurrentUser().patientId) : null;
    const doctors = HospitalApp.getDoctors();

    buildSelectOptions(departmentSelect, HospitalApp.getDepartmentOptions(), 'All departments');
    function refreshDoctors(){
      const dep = departmentSelect.value;
      const list = doctors.filter(d => !dep || d.department === dep);
      doctorSelect.innerHTML = `<option value="">Select doctor</option>` + list.map(d => `<option value="${d.id}">${d.name} — ${d.specialization}</option>`).join('');
      const urlDoctor = getInitialDoctor();
      if(urlDoctor && list.some(d => d.id === urlDoctor)){
        doctorSelect.value = urlDoctor;
      }
      refreshSlots();
      refreshSummary();
    }

    function refreshSlots(){
      const doctor = HospitalApp.findDoctor(doctorSelect.value);
      slotContainer.innerHTML = '';
      selectedTime.value = '';
      if(!doctor){
        slotContainer.innerHTML = '<span class="text-muted small">Select a doctor to load slots.</span>';
        return;
      }
      const fromUrl = new URL(window.location.href).searchParams.get('time');
      doctor.slots.forEach(slot => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slot-btn';
        btn.textContent = slot;
        if(fromUrl === slot){
          btn.classList.add('active');
          selectedTime.value = slot;
        }
        btn.addEventListener('click', () => {
          slotContainer.querySelectorAll('.slot-btn').forEach(el => el.classList.remove('active'));
          btn.classList.add('active');
          selectedTime.value = slot;
        });
        slotContainer.appendChild(btn);
      });
    }

    function refreshSummary(){
      const doctor = HospitalApp.findDoctor(doctorSelect.value);
      summary.innerHTML = doctor ? `
        <div class="mb-2"><span class="fw-semibold">Doctor:</span> ${doctor.name}</div>
        <div class="mb-2"><span class="fw-semibold">Department:</span> ${doctor.department}</div>
        <div class="mb-2"><span class="fw-semibold">Fee:</span> $${doctor.fee}</div>
        <div><span class="fw-semibold">Available:</span> ${doctor.availability}</div>
      ` : 'Select a doctor to see available slots.';
    }

    if(patient){
      document.getElementById('patientName').value = patient.name;
      document.getElementById('patientEmail').value = patient.email;
      document.getElementById('patientPhone').value = patient.phone;
    }
    const params = new URL(window.location.href).searchParams;
    if(params.get('department')) departmentSelect.value = params.get('department');
    if(params.get('doctorId')) doctorSelect.value = params.get('doctorId');
    if(!dateInput.value) dateInput.value = HospitalApp.todayString();
    refreshDoctors();

    departmentSelect.addEventListener('change', refreshDoctors);
    doctorSelect.addEventListener('change', () => { refreshSlots(); refreshSummary(); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if(!form.checkValidity() || !selectedTime.value){
        form.classList.add('was-validated');
        HospitalApp.showToast('Please complete all required fields.', 'danger');
        return;
      }
      const doctor = HospitalApp.findDoctor(doctorSelect.value);
      const appointment = HospitalApp.bookAppointment({
        patientId: HospitalApp.getCurrentUser()?.patientId || null,
        patientName: document.getElementById('patientName').value.trim(),
        patientEmail: document.getElementById('patientEmail').value.trim(),
        patientPhone: document.getElementById('patientPhone').value.trim(),
        doctorId: doctor.id,
        department: doctor.department,
        date: dateInput.value,
        time: selectedTime.value,
        reason: document.getElementById('visitReason').value.trim()
      });
      const modalBody = document.getElementById('confirmationBody');
      modalBody.innerHTML = `
        <p class="mb-2">Your appointment has been booked successfully.</p>
        <div class="small text-muted">
          <div><strong>Reference:</strong> ${appointment.id}</div>
          <div><strong>Doctor:</strong> ${appointment.doctorName}</div>
          <div><strong>Date:</strong> ${HospitalApp.formatDate(appointment.date)}</div>
          <div><strong>Time:</strong> ${appointment.time}</div>
        </div>`;
      bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmationModal')).show();
      form.reset();
      form.classList.remove('was-validated');
      if(patient){
        document.getElementById('patientName').value = patient.name;
        document.getElementById('patientEmail').value = patient.email;
        document.getElementById('patientPhone').value = patient.phone;
      }
      refreshDoctors();
      HospitalApp.showToast('Appointment confirmed.', 'success');
    });
  }

  function statusBadge(status){
    const map = {Upcoming:'success',Pending:'warning',Completed:'secondary',Cancelled:'danger'};
    return `<span class="badge rounded-pill text-bg-${map[status] || 'secondary'}">${status}</span>`;
  }

  function timelineItem(title, meta, icon='bi-heart-pulse'){
    return `
      <div class="timeline-item">
        <div class="timeline-icon"><i class="bi ${icon}"></i></div>
        <div>
          <div class="fw-bold">${title}</div>
          <div class="text-muted small">${meta}</div>
        </div>
      </div>`;
  }

  function appointmentCard(a, options = {}){
    return `
      <div class="command-card h-100">
        <div class="accent-bar"></div>
        <div class="p-4">
          <div class="d-flex justify-content-between align-items-start gap-3">
            <div>
              <div class="signal mb-2"><span class="dot"></span>${a.status}</div>
              <h3 class="h5 mb-1">${a.doctorName}</h3>
              <div class="text-muted">${a.department}</div>
            </div>
            ${statusBadge(a.status)}
          </div>
          <div class="d-flex flex-wrap gap-2 mt-3">
            <span class="badge rounded-pill badge-soft"><i class="bi bi-calendar3 me-1"></i>${HospitalApp.formatDate(a.date)}</span>
            <span class="badge rounded-pill badge-soft"><i class="bi bi-clock me-1"></i>${a.time}</span>
          </div>
          <p class="text-muted mt-3 mb-4">${a.reason}</p>
          ${options.actions ? `
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-outline-primary btn-sm" data-reschedule="${a.id}">Reschedule</button>
              <button class="btn btn-outline-danger btn-sm" data-cancel="${a.id}">Cancel</button>
            </div>` : ''}
        </div>
      </div>`;
  }

  function renderPatientDashboard(){
    const root = document.getElementById('patientDashboardRoot');
    if(!root) return;
    const user = HospitalApp.getCurrentUser();
    if(!user || user.role !== 'patient'){
      root.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-person-lock fs-1 text-muted"></i>
          <h1 class="h4 mt-3">Patient login required</h1>
          <p class="text-muted">Sign in to view appointments and profile details.</p>
          <a class="btn btn-primary" href="login.html">Login</a>
        </div>`;
      return;
    }
    const patient = HospitalApp.findPatient(user.patientId);
    const all = HospitalApp.getAppointments().filter(a => a.patientId === patient.id);
    const upcoming = all.filter(a => a.status === 'Upcoming' || a.status === 'Pending');
    const history = all.filter(a => a.status === 'Completed' || a.status === 'Cancelled');
    const stats = {
      upcoming: upcoming.length,
      completed: history.filter(a => a.status === 'Completed').length,
      cancelled: history.filter(a => a.status === 'Cancelled').length,
      total: all.length
    };
    const next = upcoming[0];
    const timelineSource = all.slice(0, 4);
    root.innerHTML = `
      <div class="dashboard-hero mb-4">
        <div class="eyebrow mb-3"><i class="bi bi-suit-heart"></i> Patient command center</div>
        <div class="row align-items-end g-3">
          <div class="col-lg-8">
            <h1 class="mb-3">Good morning, ${patient.name}.</h1>
            <p class="text-white-50 mb-0">Here’s what’s happening with your healthcare today.</p>
          </div>
          <div class="col-lg-4 text-lg-end">
            <a href="appointment.html" class="btn btn-light btn-lg"><i class="bi bi-calendar2-plus me-2"></i>Book appointment</a>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-6 col-xl-3"><div class="metric-card p-3 p-lg-4"><div class="label">Upcoming</div><div class="value">${stats.upcoming}</div></div></div>
        <div class="col-6 col-xl-3"><div class="metric-card p-3 p-lg-4"><div class="label">Completed</div><div class="value">${stats.completed}</div></div></div>
        <div class="col-6 col-xl-3"><div class="metric-card p-3 p-lg-4"><div class="label">Cancelled</div><div class="value">${stats.cancelled}</div></div></div>
        <div class="col-6 col-xl-3"><div class="metric-card p-3 p-lg-4"><div class="label">Total visits</div><div class="value">${stats.total}</div></div></div>
      </div>

      <div class="row g-4">
        <div class="col-xl-7">
          <div class="command-card mb-4">
            <div class="accent-bar"></div>
            <div class="p-4 p-md-5">
              <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <p class="section-kicker mb-1">Next appointment</p>
                  <h2 class="section-title mb-2">${next ? next.doctorName : 'No upcoming appointment'}</h2>
                  <p class="text-muted mb-0">${next ? next.department : 'Book your next visit when needed.'}</p>
                </div>
                <span class="badge rounded-pill badge-soft">${next ? next.status : 'Idle'}</span>
              </div>
              ${next ? `
                <div class="row g-3 mb-3">
                  <div class="col-md-6"><div class="stat-chip"><div class="icon"><i class="bi bi-calendar3"></i></div><div><div class="label">Date</div><div class="fw-bold">${HospitalApp.formatDate(next.date)}</div></div></div></div>
                  <div class="col-md-6"><div class="stat-chip"><div class="icon"><i class="bi bi-clock"></i></div><div><div class="label">Time</div><div class="fw-bold">${next.time}</div></div></div></div>
                </div>
                <p class="text-muted mb-4">${next.reason}</p>
                <div class="d-flex flex-wrap gap-2">
                  <button class="btn btn-primary btn-sm" data-reschedule="${next.id}">Reschedule</button>
                  <button class="btn btn-outline-secondary btn-sm" data-cancel="${next.id}">Cancel appointment</button>
                </div>
              ` : `
                <p class="text-muted mb-0">Your next appointment will appear here once booked.</p>
              `}
            </div>
          </div>

          <div class="command-card mb-4">
            <div class="accent-bar"></div>
            <div class="p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <p class="section-kicker mb-1">Upcoming care</p>
                  <h2 class="h4 mb-0">Your next visits</h2>
                </div>
                <a href="doctors.html" class="btn btn-outline-primary btn-sm">Find doctors</a>
              </div>
              ${upcoming.length ? `
                <div class="row g-3">
                  ${upcoming.map(a => `
                    <div class="col-md-6">
                      ${appointmentCard(a, {actions:true})}
                    </div>`).join('')}
                </div>
              ` : '<div class="empty-state py-4"><p class="text-muted mb-0">No upcoming appointments.</p></div>'}
            </div>
          </div>
        </div>

        <div class="col-xl-5">
          <div class="command-card mb-4">
            <div class="accent-bar"></div>
            <div class="p-4">
              <p class="section-kicker mb-1">Quick actions</p>
              <h2 class="h5 mb-3">Move fast</h2>
              <div class="d-grid gap-2">
                <a href="appointment.html" class="btn btn-primary btn-lg btn-sm"><i class="bi bi-calendar2-plus me-2"></i>Book appointment</a>
                <a href="doctors.html" class="btn btn-outline-primary btn-lg btn-sm"><i class="bi bi-search me-2"></i>Find doctor</a>
                <button class="btn btn-outline-secondary btn-lg btn-sm" type="button" onclick="HospitalApp.showToast('Medical records preview is coming soon.', 'primary')"><i class="bi bi-folder2-open me-2"></i>Medical records</button>
                <button class="btn btn-outline-secondary btn-lg btn-sm" type="button" onclick="HospitalApp.showToast('Prescription view is coming soon.', 'primary')"><i class="bi bi-prescription2 me-2"></i>Prescriptions</button>
              </div>
            </div>
          </div>

          <div class="command-card mb-4">
            <div class="accent-bar"></div>
            <div class="p-4">
              <p class="section-kicker mb-1">Health timeline</p>
              <h2 class="h5 mb-3">Recent activity</h2>
              <div class="timeline">
                ${timelineSource.length ? timelineSource.map(a => timelineItem(
                  `${a.doctorName} · ${a.status}`,
                  `${HospitalApp.formatDate(a.date)} · ${a.time}`,
                  a.status === 'Completed' ? 'bi-check2-circle' : a.status === 'Cancelled' ? 'bi-x-circle' : 'bi-calendar-event'
                )).join('') : '<p class="text-muted mb-0">No recent activity.</p>'}
              </div>
            </div>
          </div>

          <div class="command-card">
            <div class="accent-bar"></div>
            <div class="p-4">
              <p class="section-kicker mb-1">Profile snapshot</p>
              <h2 class="h5 mb-3">${patient.name}</h2>
              <div class="small text-muted mb-2"><i class="bi bi-envelope me-2"></i>${patient.email}</div>
              <div class="small text-muted mb-2"><i class="bi bi-telephone me-2"></i>${patient.phone}</div>
              <div class="small text-muted mb-2"><i class="bi bi-droplet-half me-2"></i>${patient.bloodGroup}</div>
              <div class="small text-muted"><i class="bi bi-calendar3 me-2"></i>Member since ${HospitalApp.formatDate(patient.memberSince)}</div>
            </div>
          </div>
        </div>
      </div>`;

    root.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', () => {
        HospitalApp.cancelAppointment(btn.dataset.cancel);
        HospitalApp.showToast('Appointment cancelled.', 'warning');
        renderPatientDashboard();
      });
    });
    root.querySelectorAll('[data-reschedule]').forEach(btn => {
      btn.addEventListener('click', () => {
        const appointment = HospitalApp.findAppointment(btn.dataset.reschedule);
        document.getElementById('rescheduleAppointmentId').value = appointment.id;
        document.getElementById('rescheduleDate').value = HospitalApp.todayString();
        const times = HospitalApp.findDoctor(appointment.doctorId)?.slots || [];
        document.getElementById('rescheduleTime').innerHTML = times.map(t => `<option>${t}</option>`).join('');
        bootstrap.Modal.getOrCreateInstance(document.getElementById('rescheduleModal')).show();
      });
    });

    const saveRescheduleBtn = document.getElementById('saveRescheduleBtn');
    if(saveRescheduleBtn) saveRescheduleBtn.onclick = () => {
      const id = document.getElementById('rescheduleAppointmentId').value;
      const date = document.getElementById('rescheduleDate').value;
      const time = document.getElementById('rescheduleTime').value;
      if(!date || !time) return HospitalApp.showToast('Choose a new date and time.', 'danger');
      HospitalApp.rescheduleAppointment(id, date, time);
      bootstrap.Modal.getOrCreateInstance(document.getElementById('rescheduleModal')).hide();
      HospitalApp.showToast('Appointment rescheduled.', 'success');
      renderPatientDashboard();
    };
  }

  function renderAdminDashboard(){
    const root = document.getElementById('adminDashboardRoot');
    if(!root) return;
    const user = HospitalApp.getCurrentUser();
    if(!user || user.role !== 'admin'){
      root.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-shield-lock fs-1 text-muted"></i>
          <h1 class="h4 mt-3">Admin login required</h1>
          <p class="text-muted">Sign in as an admin to access management tools.</p>
          <a class="btn btn-primary" href="login.html">Login</a>
        </div>`;
      return;
    }
    const doctors = HospitalApp.getDoctors();
    const patients = HospitalApp.getPatients();
    const appointments = HospitalApp.getAppointments();
    const today = HospitalApp.todayString();
    const stats = {
      patients: patients.length,
      doctors: doctors.length,
      today: appointments.filter(a => a.date === today).length,
      pending: appointments.filter(a => a.status === 'Pending').length
    };
    const departmentNames = ['Cardiology','Neurology','Orthopedics','Pediatrics','Radiology','Dermatology','Internal Medicine','ENT'];
    const deptData = departmentNames.map(name => {
      const count = appointments.filter(a => a.department === name && a.status !== 'Cancelled').length;
      return {name, count};
    }).sort((a,b) => b.count - a.count);
    const todayAppointments = appointments.filter(a => a.date === today && a.status !== 'Cancelled').slice(0, 5);
    const pendingList = appointments.filter(a => a.status === 'Pending').slice(0, 4);
    const availabilityRate = Math.round((doctors.filter(d => d.status === 'Available').length / doctors.length) * 100);
    root.innerHTML = `
      <div class="dashboard-hero mb-4">
        <div class="eyebrow mb-3"><i class="bi bi-shield-check"></i> Hospital operations control center</div>
        <div class="row align-items-end g-3">
          <div class="col-lg-8">
            <h1 class="mb-3">Operational awareness, without the noise.</h1>
            <p class="text-white-50 mb-0">Monitor appointment flow, doctor availability, and department pressure from a calmer, more useful interface.</p>
          </div>
          <div class="col-lg-4 text-lg-end">
            <span class="badge rounded-pill bg-white text-navy me-2">Availability ${availabilityRate}%</span>
            <span class="badge rounded-pill text-bg-danger">${stats.pending} pending</span>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-xl-3"><div class="metric-card p-3 p-lg-4"><div class="label">Total patients</div><div class="value">${stats.patients}</div></div></div>
        <div class="col-6 col-xl-3"><div class="metric-card p-3 p-lg-4"><div class="label">Total doctors</div><div class="value">${stats.doctors}</div></div></div>
        <div class="col-6 col-xl-3"><div class="metric-card p-3 p-lg-4"><div class="label">Today’s appointments</div><div class="value">${stats.today}</div></div></div>
        <div class="col-6 col-xl-3"><div class="metric-card p-3 p-lg-4"><div class="label">Pending</div><div class="value">${stats.pending}</div></div></div>
      </div>

      <div class="row g-4">
        <div class="col-lg-5">
          <div class="command-card h-100">
            <div class="accent-bar"></div>
            <div class="p-4">
              <p class="section-kicker mb-1">Today’s schedule</p>
              <h2 class="h4 mb-3">Appointment activity</h2>
              <div class="timeline">
                ${todayAppointments.length ? todayAppointments.map(a => timelineItem(
                  `${a.patientName} → ${a.doctorName}`,
                  `${HospitalApp.formatDate(a.date)} · ${a.time} · ${a.department}`,
                  a.status === 'Pending' ? 'bi-hourglass-split' : 'bi-calendar-check'
                )).join('') : '<p class="text-muted mb-0">No appointments scheduled for today.</p>'}
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="command-card h-100">
            <div class="accent-bar"></div>
            <div class="p-4">
              <p class="section-kicker mb-1">Department performance</p>
              <h2 class="h4 mb-3">Flow by department</h2>
              <div class="d-flex flex-column gap-3">
                ${deptData.map(item => {
                  const width = Math.max(item.count * 12, 10);
                  return `
                    <div>
                      <div class="d-flex justify-content-between small fw-semibold mb-1">
                        <span>${item.name}</span><span>${item.count}</span>
                      </div>
                      <div class="progress" style="height:.65rem;background:#edf2f7">
                        <div class="progress-bar" style="width:${Math.min(width,100)}%;background:linear-gradient(90deg, var(--blue), var(--teal))"></div>
                      </div>
                    </div>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-3">
          <div class="command-card h-100">
            <div class="accent-bar"></div>
            <div class="p-4">
              <p class="section-kicker mb-1">Alerts</p>
              <h2 class="h4 mb-3">Action queue</h2>
              <div class="timeline">
                ${pendingList.length ? pendingList.map(a => timelineItem(
                  `${a.patientName}`,
                  `${a.department} · ${a.time}`,
                  'bi-exclamation-triangle'
                )).join('') : '<p class="text-muted mb-0">No pending items.</p>'}
              </div>
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="command-card">
            <div class="accent-bar"></div>
            <div class="p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <p class="section-kicker mb-1">Doctor availability</p>
                  <h2 class="h4 mb-0">Manage clinicians</h2>
                </div>
              </div>
              <div class="row g-3">
                ${doctors.map(d => `
                  <div class="col-md-6 col-xl-3">
                    <div class="doctor-result h-100">
                      <div class="p-4">
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
                          <div class="doctor-avatar">${d.name.split(' ').map(n => n[0]).slice(0,2).join('')}</div>
                          <button class="btn btn-sm ${d.status==='Available'?'btn-success':'btn-outline-secondary'}" data-doctor-toggle="${d.id}">${d.status}</button>
                        </div>
                        <div class="signal mb-2"><span class="dot"></span>${d.availability}</div>
                        <h3 class="h6 mb-1">${d.name}</h3>
                        <div class="text-muted small mb-3">${d.department}</div>
                        <div class="d-flex justify-content-between small">
                          <span>${d.experience}+ yrs</span>
                          <span><i class="bi bi-star-fill text-warning me-1"></i>${d.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>`;

    root.querySelectorAll('[data-doctor-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const doctor = HospitalApp.findDoctor(btn.dataset.doctorToggle);
        const next = doctor.status === 'Available' ? 'Unavailable' : 'Available';
        HospitalApp.updateDoctor(doctor.id, {status: next});
        HospitalApp.showToast(`Doctor status updated to ${next}.`, 'success');
        renderAdminDashboard();
      });
    });
    root.querySelectorAll('[data-admin-cancel]').forEach(btn => {
      btn.addEventListener('click', () => {
        HospitalApp.cancelAppointment(btn.dataset.adminCancel);
        HospitalApp.showToast('Appointment cancelled.', 'warning');
        renderAdminDashboard();
      });
    });
  }

  function initLoginPage(){
    const form = document.getElementById('loginForm');
    if(!form) return;
    const tabs = document.querySelectorAll('#loginTabs [data-role]');
    const email = document.getElementById('loginEmail');
    const password = document.getElementById('loginPassword');
    const role = document.getElementById('loginRole');
    const presets = {
      patient: {email:'patient@demo.com', password:'demo123'},
      doctor: {email:'doctor@demo.com', password:'demo123'},
      admin: {email:'admin@hospital.com', password:'admin123'}
    };
    function setRole(next){
      role.value = next;
      tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.role === next));
      email.value = presets[next].email;
      password.value = presets[next].password;
    }
    tabs.forEach(btn => btn.addEventListener('click', () => setRole(btn.dataset.role)));
    setRole('patient');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentRole = role.value;
      const creds = {email: email.value.trim().toLowerCase(), password: password.value};
      let user = null;
      if(currentRole === 'patient'){
        user = HospitalApp.getPatients().find(p => p.email.toLowerCase() === creds.email && p.password === creds.password);
        if(user) HospitalApp.setCurrentUser({role:'patient', email:user.email, name:user.name, patientId:user.id});
      } else if(currentRole === 'doctor'){
        const doctor = HospitalApp.getDoctors()[0];
        if(creds.email === 'doctor@demo.com' && creds.password === 'demo123'){
          HospitalApp.setCurrentUser({role:'doctor', email:doctor.name, name:doctor.name, doctorId:doctor.id});
          user = doctor;
        }
      } else {
        if(creds.email === 'admin@hospital.com' && creds.password === 'admin123'){
          HospitalApp.setCurrentUser({role:'admin', email:creds.email, name:'Administrator'});
          user = {role:'admin'};
        }
      }
      if(!user){
        HospitalApp.showToast('Invalid credentials for the selected role.', 'danger');
        return;
      }
      HospitalApp.showToast('Login successful.', 'success');
      setTimeout(() => {
        window.location.href = currentRole === 'admin' ? 'admin-dashboard.html' : currentRole === 'patient' ? 'patient-dashboard.html' : 'doctors.html';
      }, 250);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if(page === 'appointment') initAppointmentPage();
    if(page === 'patient-dashboard') {
      renderPatientDashboard();
      HospitalApp.initSessionActions();
    }
    if(page === 'admin-dashboard') {
      renderAdminDashboard();
      HospitalApp.initSessionActions();
    }
    if(page === 'login') initLoginPage();
  });
})();

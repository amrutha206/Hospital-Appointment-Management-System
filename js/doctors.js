(function(){
  function doctorCard(doctor){
    return `
      <div class="col-md-6 col-xl-4">
        <div class="doctor-result h-100">
          <div class="p-4 p-lg-4">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div class="d-flex gap-3">
                <div class="doctor-avatar">${doctor.name.split(' ').map(n => n[0]).slice(0,2).join('')}</div>
                <div>
                  <div class="signal mb-2"><span class="dot"></span>${doctor.status}</div>
                  <h3 class="h5 mb-1">${doctor.name}</h3>
                  <div class="text-muted">${doctor.specialization}</div>
                </div>
              </div>
              <span class="badge rounded-pill badge-soft">${doctor.department}</span>
            </div>
            <div class="doctor-meta mb-3">
              <span><i class="bi bi-briefcase"></i>${doctor.experience}+ yrs</span>
              <span><i class="bi bi-star-fill text-warning"></i>${doctor.rating}</span>
              <span><i class="bi bi-calendar2-check"></i>${doctor.availability}</span>
            </div>
            <p class="text-muted mb-4">${doctor.bio}</p>
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <div class="small text-muted text-uppercase fw-bold">Consultation fee</div>
                <div class="fw-bold text-navy">$${doctor.fee}</div>
              </div>
              <div class="d-flex gap-2">
                <span class="badge rounded-pill text-bg-light border text-dark">In-person</span>
                <span class="badge rounded-pill text-bg-light border text-dark">Video consult</span>
              </div>
            </div>
          </div>
          <div class="px-4 pb-4 d-flex justify-content-end">
            <a class="btn btn-primary btn-sm" href="doctor-profile.html?id=${encodeURIComponent(doctor.id)}">View profile</a>
          </div>
        </div>
      </div>`;
  }

  function renderDoctorsPage(){
    const grid = document.getElementById('doctorGrid');
    if(!grid) return;
    const empty = document.getElementById('doctorEmpty');
    const search = document.getElementById('doctorSearch');
    const department = document.getElementById('departmentFilter');
    const availability = document.getElementById('availabilityFilter');
    const sort = document.getElementById('sortFilter');

    const url = new URL(window.location.href);
    if(url.searchParams.get('q') && search) search.value = url.searchParams.get('q');
    if(url.searchParams.get('department') && department) department.value = url.searchParams.get('department');

    function apply(){
      let list = HospitalApp.getDoctors().slice();
      const q = (search?.value || '').trim().toLowerCase();
      const dep = department?.value || '';
      const avail = availability?.value || '';
      const sortValue = sort?.value || 'rating';

      if(q){
        list = list.filter(d => [d.name, d.specialization, d.department, d.bio].join(' ').toLowerCase().includes(q));
      }
      if(dep) list = list.filter(d => d.department === dep);
      if(avail) list = list.filter(d => d.availability === avail);

      list.sort((a,b) => {
        if(sortValue === 'experience') return b.experience - a.experience;
        if(sortValue === 'name') return a.name.localeCompare(b.name);
        return b.rating - a.rating;
      });

      grid.innerHTML = list.map(doctorCard).join('');
      if(empty) empty.classList.toggle('d-none', list.length !== 0);
    }

    [search, department, availability, sort].forEach(el => {
      if(!el) return;
      ['input','change'].forEach(evt => el.addEventListener(evt, apply));
    });
    apply();
  }

  function renderDoctorProfile(){
    const root = document.getElementById('doctorProfileRoot');
    if(!root) return;
    const id = new URL(window.location.href).searchParams.get('id') || HospitalApp.getDoctors()[0]?.id;
    const doctor = HospitalApp.findDoctor(id);
    if(!doctor){
      root.innerHTML = `<div class="empty-state"><h2 class="h4">Doctor not found</h2><a class="btn btn-primary mt-3" href="doctors.html">Back to doctors</a></div>`;
      return;
    }
    const dates = Array.from({length:7}, (_,i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0,10);
    });
    root.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="dashboard-surface p-4 p-md-5">
            <div class="d-flex flex-column flex-md-row gap-3 align-items-md-start justify-content-between">
              <div class="d-flex gap-3 align-items-center">
                <div class="doctor-avatar fs-4">${doctor.name.split(' ').map(n => n[0]).slice(0,2).join('')}</div>
                <div>
                  <div class="signal mb-2"><span class="dot"></span>${doctor.status}</div>
                  <p class="section-kicker mb-1">${doctor.department}</p>
                  <h1 class="section-title mb-1">${doctor.name}</h1>
                  <div class="text-muted">${doctor.specialization}</div>
                </div>
              </div>
              <a class="btn btn-primary" href="appointment.html?doctorId=${encodeURIComponent(doctor.id)}"><i class="bi bi-calendar2-plus me-2"></i>Book appointment</a>
            </div>
            <div class="row g-3 mt-4">
              <div class="col-md-3"><div class="metric-card p-3"><div class="small text-muted">Experience</div><div class="value">${doctor.experience}+ yrs</div></div></div>
              <div class="col-md-3"><div class="metric-card p-3"><div class="small text-muted">Rating</div><div class="value">${doctor.rating}</div></div></div>
              <div class="col-md-3"><div class="metric-card p-3"><div class="small text-muted">Fee</div><div class="value">$${doctor.fee}</div></div></div>
              <div class="col-md-3"><div class="metric-card p-3"><div class="small text-muted">Availability</div><div class="value">${doctor.availability}</div></div></div>
            </div>
            <div class="row g-4 mt-3">
              <div class="col-md-6">
                <div class="command-card h-100">
                  <div class="accent-bar"></div>
                  <div class="p-4">
                    <h2 class="h5 card-title">Profile</h2>
                    <p class="text-muted mb-0">${doctor.bio}</p>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="command-card h-100">
                  <div class="accent-bar"></div>
                  <div class="p-4">
                    <h2 class="h5 card-title">Qualifications</h2>
                    <ul class="list-unstyled text-muted mb-0">
                      <li class="mb-2"><i class="bi bi-check2-circle text-success me-2"></i>${doctor.qualification}</li>
                      <li class="mb-2"><i class="bi bi-check2-circle text-success me-2"></i>${doctor.education}</li>
                      <li><i class="bi bi-check2-circle text-success me-2"></i>Languages: English, Hindi</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="dashboard-surface p-4 summary-card">
            <h2 class="h5 mb-3 text-white">Available dates</h2>
            <div class="d-flex flex-wrap gap-2 mb-4">
              ${dates.map(d => `<span class="badge rounded-pill bg-white text-dark border">${HospitalApp.formatDate(d)}</span>`).join('')}
            </div>
            <h3 class="h5 mb-3 text-white">Available time slots</h3>
            <div class="d-flex flex-wrap gap-2 mb-4">
              ${doctor.slots.map(slot => `<button class="slot-btn" type="button" data-slot="${slot}">${slot}</button>`).join('')}
            </div>
            <a id="profileBookBtn" class="btn btn-light w-100" href="appointment.html?doctorId=${encodeURIComponent(doctor.id)}"><i class="bi bi-calendar2-plus me-2"></i>Book selected slot</a>
          </div>
        </div>
      </div>`;

    root.querySelectorAll('[data-slot]').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('[data-slot]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const href = new URL('appointment.html', window.location.href);
        href.searchParams.set('doctorId', doctor.id);
        href.searchParams.set('time', btn.dataset.slot);
        document.getElementById('profileBookBtn').href = href.toString();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if(page === 'doctors') renderDoctorsPage();
    if(page === 'doctor-profile') renderDoctorProfile();
  });
})();

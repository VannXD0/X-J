/* ====================================================
   X.J CLASS PORTFOLIO — MAIN SCRIPT
   Credits: Revan / Vanx
   Auto-detection of folder data & photos
   Live Search for Siswa & Siswi
   ==================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initThemeSwitcher();
    initNavigation();
    loadStudents('siswa', 'siswaGrid', 'siswaSearch');
    loadStudents('siswi', 'siswiGrid', 'siswiSearch');
    loadWalas();
    loadMemori();
    initLightbox();
});

/* ============================================================
   THEME TOGGLE SWITCHER (SINGLE BUTTON)
   ============================================================ */
function initThemeSwitcher() {
    const toggleBtn = document.getElementById('themeToggleBtn');
    const toggleIcon = document.getElementById('themeToggleIcon');
    const toggleText = document.getElementById('themeToggleText');

    const stored = localStorage.getItem('xj-theme') || 'cream';
    setTheme(stored);

    toggleBtn?.addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme') || 'cream';
        const nextTheme = current === 'cream' ? 'gray' : 'cream';
        setTheme(nextTheme);
    });

    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('xj-theme', theme);
        if (theme === 'cream') {
            if (toggleIcon) toggleIcon.className = 'fa-solid fa-palette';
            if (toggleText) toggleText.textContent = 'Coklat';
        } else {
            if (toggleIcon) toggleIcon.className = 'fa-solid fa-moon';
            if (toggleText) toggleText.textContent = 'Abu';
        }
    }
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const tabs = document.querySelectorAll('.tab-content');

    function switchTab(tabId) {
        tabs.forEach(t => t.classList.remove('active'));
        navLinks.forEach(l => l.classList.remove('active'));
        mobileLinks.forEach(l => l.classList.remove('active'));

        const target = document.getElementById('tab-' + tabId);
        if (target) {
            target.classList.add('active');
        }

        navLinks.forEach(l => {
            if (l.dataset.tab === tabId) l.classList.add('active');
        });
        mobileLinks.forEach(l => {
            if (l.dataset.tab === tabId) l.classList.add('active');
        });

        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            switchTab(link.dataset.tab);
        });
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            switchTab(link.dataset.tab);
        });
    });

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileNav.classList.toggle('open');
    });
}

/* ============================================================
   DATA PARSER
   ============================================================ */
function parseDataFile(text) {
    const data = {};
    const lines = text.split('\n');
    for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
            const key = line.substring(0, colonIdx).trim().toLowerCase();
            const val = line.substring(colonIdx + 1).trim();
            if (key && val) {
                data[key] = val;
            }
        }
    }
    return data;
}

async function findPhoto(basePath, folderNum) {
    const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
    for (const ext of extensions) {
        const url = `${basePath}/${folderNum}/${folderNum}${ext}`;
        try {
            const resp = await fetch(url, { method: 'HEAD' });
            if (resp.ok) return url;
        } catch (e) { /* skip */ }
    }
    for (const ext of extensions) {
        const url = `${basePath}/${folderNum}/foto${ext}`;
        try {
            const resp = await fetch(url, { method: 'HEAD' });
            if (resp.ok) return url;
        } catch (e) { /* skip */ }
    }
    return null;
}

/* ============================================================
   STUDENTS & SISWI LOADER + LIVE SEARCH
   ============================================================ */
async function loadStudents(type, gridId, searchInputId) {
    const grid = document.getElementById(gridId);
    const searchInput = document.getElementById(searchInputId);
    const students = [];
    let folderNum = 1;
    let consecutiveFails = 0;

    while (consecutiveFails < 3 && folderNum <= 50) {
        try {
            const txtUrl = `${type}/${folderNum}/${folderNum}.txt`;
            const resp = await fetch(txtUrl);

            if (!resp.ok) {
                consecutiveFails++;
                folderNum++;
                continue;
            }

            const text = await resp.text();
            if (!text.trim()) {
                consecutiveFails++;
                folderNum++;
                continue;
            }

            consecutiveFails = 0;
            const data = parseDataFile(text);
            const photo = await findPhoto(type, folderNum);

            students.push({
                num: folderNum,
                data: data,
                photo: photo,
                type: type
            });
        } catch (e) {
            consecutiveFails++;
        }
        folderNum++;
    }

    if (type === 'siswa') {
        document.getElementById('siswaCount').textContent = students.length;
    } else {
        document.getElementById('siswiCount').textContent = students.length;
    }

    if (students.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fa-solid fa-folder-open"></i></div>
                <p>Belum ada data ${type}.</p>
                <p style="margin-top:8px; font-size:0.85rem; color:var(--text-muted);">
                    Input data di folder: <code>${type}/1/1.txt</code> & <code>${type}/1/1.png</code>
                </p>
            </div>
        `;
        return;
    }

    // Render function
    function renderList(filtered) {
        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
                    <p>Tidak ada ${type} yang sesuai dengan pencarian.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';
        filtered.forEach((s) => {
            const card = document.createElement('div');
            card.classList.add('student-card');

            const name = s.data.nama || s.data.name || `${type === 'siswa' ? 'Siswa' : 'Siswi'} ${s.num}`;
            const school = s.data.asal || s.data['asal sekolah'] || s.data.sekolah || 'SMAN 6 Kab. Tangerang';
            const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

            card.innerHTML = `
                <div class="student-photo-wrap">
                    ${s.photo
                        ? `<img class="student-photo" src="${s.photo}" alt="${name}" loading="lazy">`
                        : `<div class="student-photo-placeholder">${initials}</div>`
                    }
                    <div class="student-number">${s.num}</div>
                </div>
                <div class="student-info">
                    <div class="student-name">${name}</div>
                    <div class="student-school"><i class="fa-solid fa-school"></i> ${school}</div>
                    <div class="student-tag">Profil Detail <i class="fa-solid fa-arrow-right"></i></div>
                </div>
            `;

            card.addEventListener('click', () => openStudentModal(s));
            grid.appendChild(card);
        });
    }

    // Initial render
    renderList(students);

    // Attach search event
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            if (!q) {
                renderList(students);
                return;
            }
            const filtered = students.filter(s => {
                const name = (s.data.nama || s.data.name || '').toLowerCase();
                const school = (s.data.asal || s.data['asal sekolah'] || s.data.sekolah || '').toLowerCase();
                return name.includes(q) || school.includes(q);
            });
            renderList(filtered);
        });
    }
}

/* ============================================================
   STUDENT MODAL
   ============================================================ */
function openStudentModal(student) {
    const modal = document.getElementById('studentModal');
    const photoEl = document.getElementById('modalPhoto');
    const nameEl = document.getElementById('modalName');
    const detailsEl = document.getElementById('modalDetails');

    const name = student.data.nama || student.data.name || 'Tanpa Nama';
    nameEl.textContent = name;

    if (student.photo) {
        photoEl.src = student.photo;
        photoEl.alt = name;
        photoEl.style.display = 'block';
        photoEl.parentElement.style.display = 'block';
    } else {
        photoEl.style.display = 'none';
        photoEl.parentElement.style.display = 'flex';
        photoEl.parentElement.style.alignItems = 'center';
        photoEl.parentElement.style.justifyContent = 'center';
        photoEl.parentElement.innerHTML = `
            <div style="font-size:3.5rem; font-family:var(--font-display); font-weight:800; color:var(--accent);">
                ${name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
            </div>
        `;
    }

    const iconMap = {
        'nama': '<i class="fa-solid fa-user"></i> Nama',
        'name': '<i class="fa-solid fa-user"></i> Nama',
        'asal': '<i class="fa-solid fa-school"></i> Asal Sekolah',
        'asal sekolah': '<i class="fa-solid fa-school"></i> Asal Sekolah',
        'sekolah': '<i class="fa-solid fa-school"></i> Sekolah',
        'hobi': '<i class="fa-solid fa-gamepad"></i> Hobi',
        'hobby': '<i class="fa-solid fa-gamepad"></i> Hobi',
        'cita-cita': '<i class="fa-solid fa-star"></i> Cita-cita',
        'cita': '<i class="fa-solid fa-star"></i> Cita-cita',
        'alamat': '<i class="fa-solid fa-location-dot"></i> Alamat',
        'ttl': '<i class="fa-solid fa-cake-candles"></i> TTL',
        'tanggal lahir': '<i class="fa-solid fa-cake-candles"></i> Tanggal Lahir',
        'agama': '<i class="fa-solid fa-book-bookmark"></i> Agama',
        'no hp': '<i class="fa-solid fa-phone"></i> No. HP',
        'email': '<i class="fa-solid fa-envelope"></i> Email',
        'motto': '<i class="fa-solid fa-quote-left"></i> Motto',
    };

    detailsEl.innerHTML = '';
    for (const [key, val] of Object.entries(student.data)) {
        const label = iconMap[key] || `<i class="fa-solid fa-circle-info"></i> ${key.charAt(0).toUpperCase() + key.slice(1)}`;
        const row = document.createElement('div');
        row.classList.add('modal-detail-row');
        row.innerHTML = `
            <span class="detail-label">${label}</span>
            <span class="detail-value">${val}</span>
        `;
        detailsEl.appendChild(row);
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

document.getElementById('modalClose')?.addEventListener('click', closeModal);
document.getElementById('studentModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
});

function closeModal() {
    const modal = document.getElementById('studentModal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
    document.querySelector('.modal-photo-wrap').innerHTML = '<img class="modal-photo" id="modalPhoto" src="" alt="Foto profil">';
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeModal();
        closeLightbox();
    }
});

/* ============================================================
   WALAS LOADER
   ============================================================ */
async function loadWalas() {
    const nameEl = document.getElementById('walasName');
    const detailsEl = document.getElementById('walasDetails');
    const photoFrame = document.querySelector('.walas-photo-frame');

    try {
        const resp = await fetch('walas/1.txt');
        if (resp.ok) {
            const text = await resp.text();
            if (text.trim()) {
                const data = parseDataFile(text);
                if (data.nama || data.name) {
                    nameEl.textContent = data.nama || data.name;
                }

                detailsEl.innerHTML = '';
                const iconMap = {
                    'nama': '<i class="fa-solid fa-user"></i> Nama',
                    'name': '<i class="fa-solid fa-user"></i> Nama',
                    'nip': '<i class="fa-solid fa-id-card"></i> NIP',
                    'jabatan': '<i class="fa-solid fa-briefcase"></i> Jabatan',
                    'mata pelajaran': '<i class="fa-solid fa-book"></i> Mapel',
                    'mapel': '<i class="fa-solid fa-book"></i> Mapel',
                    'motto': '<i class="fa-solid fa-quote-left"></i> Motto',
                };

                for (const [key, val] of Object.entries(data)) {
                    const label = iconMap[key] || `<i class="fa-solid fa-circle-info"></i> ${key.charAt(0).toUpperCase() + key.slice(1)}`;
                    const item = document.createElement('div');
                    item.classList.add('walas-detail-item');
                    item.innerHTML = `
                        <span class="walas-detail-label">${label}</span>
                        <span class="walas-detail-value">${val}</span>
                    `;
                    detailsEl.appendChild(item);
                }
            }
        }
    } catch (e) { /* skip */ }

    const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
    for (const ext of extensions) {
        try {
            const url = `walas/1${ext}`;
            const resp = await fetch(url, { method: 'HEAD' });
            if (resp.ok) {
                photoFrame.innerHTML = `<img src="${url}" alt="Wali Kelas">`;
                break;
            }
        } catch (e) { /* skip */ }
    }
}

/* ============================================================
   MEMORI LOADER & FULLSCREEN LIGHTBOX
   ============================================================ */
async function loadMemori() {
    const grid = document.getElementById('memoriGrid');
    const images = [];
    let num = 1;
    let consecutiveFails = 0;

    while (consecutiveFails < 3 && num <= 50) {
        let found = false;
        const extensions = ['.png', '.jpg', '.jpeg', '.webp'];

        for (const ext of extensions) {
            try {
                const url = `image/${num}${ext}`;
                const resp = await fetch(url, { method: 'HEAD' });
                if (resp.ok) {
                    images.push({ url, num });
                    found = true;
                    break;
                }
            } catch (e) { /* skip */ }
        }

        if (found) {
            consecutiveFails = 0;
        } else {
            consecutiveFails++;
        }
        num++;
    }

    if (images.length === 0) {
        grid.innerHTML = '';
        for (let i = 1; i <= 6; i++) {
            const card = document.createElement('div');
            card.classList.add('memori-card');
            card.innerHTML = `
                <div class="memori-img-wrap">
                    <div class="memori-img-placeholder">
                        <i class="fa-solid fa-image"></i>
                        <span>File: image/${i}.png</span>
                    </div>
                </div>
                <div class="memori-label"><i class="fa-solid fa-camera"></i> Memori Kelas #${i}</div>
            `;
            card.addEventListener('click', () => {
                alert(`Upload foto kelas kamu ke folder: image/${i}.png untuk menampilkan foto memori secara otomatis!`);
            });
            grid.appendChild(card);
        }
        return;
    }

    grid.innerHTML = '';
    images.forEach((img, idx) => {
        const card = document.createElement('div');
        card.classList.add('memori-card');
        card.innerHTML = `
            <div class="memori-img-wrap">
                <img src="${img.url}" alt="Memori ${img.num}" loading="lazy">
            </div>
            <div class="memori-label"><i class="fa-solid fa-camera"></i> Memori #${img.num} <span style="margin-left:auto; font-size:0.7rem; color:var(--accent);"><i class="fa-solid fa-expand"></i> Lihat</span></div>
        `;
        card.addEventListener('click', () => openLightbox(idx, images));
        grid.appendChild(card);
    });
}

/* ============================================================
   LIGHTBOX FULLSCREEN VIEWER
   ============================================================ */
let currentLightboxIdx = 0;
let lightboxImages = [];

function initLightbox() {
    document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev')?.addEventListener('click', () => navigateLightbox(-1));
    document.getElementById('lightboxNext')?.addEventListener('click', () => navigateLightbox(1));
    document.getElementById('lightbox')?.addEventListener('click', e => {
        if (e.target === e.currentTarget || e.target.id === 'lightboxImg') closeLightbox();
    });

    document.addEventListener('keydown', e => {
        if (!document.getElementById('lightbox')?.classList.contains('open')) return;
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
}

function openLightbox(idx, images) {
    currentLightboxIdx = idx;
    lightboxImages = images;
    updateLightbox();
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox')?.classList.remove('open');
    document.body.style.overflow = '';
}

function navigateLightbox(dir) {
    currentLightboxIdx = (currentLightboxIdx + dir + lightboxImages.length) % lightboxImages.length;
    updateLightbox();
}

function updateLightbox() {
    const img = document.getElementById('lightboxImg');
    const counter = document.getElementById('lightboxCounter');
    if (lightboxImages[currentLightboxIdx]) {
        img.src = lightboxImages[currentLightboxIdx].url;
        counter.textContent = `${currentLightboxIdx + 1} / ${lightboxImages.length} • Klik foto untuk keluar`;
    }
}

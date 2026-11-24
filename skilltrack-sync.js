// skilltrack-sync.js - Koppelt ST-VSO-26.html en ST-OHD-4.html aan Supabase en regelt de huisstijl
const SUPABASE_URL = 'https://zusxpspppahpnnwehyly.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qt8y504lX4oB0VBoRmX9AQ_1bBgE9L2';

let sbClient = null;
let currentStudentId = null;

function initSupabaseSync() {
  if (!window.supabase) return;
  sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  pasBovenbalkEnFooterAan();
  laadStudentUitDatabase();
}

function pasBovenbalkEnFooterAan() {
  // 1. Vervang de oude gele knop 'Opslaan in bestand' door een strak cloud-label met groen vinkje
  const oudeOpslaanKnop = document.getElementById('save-file-btn');
  if (oudeOpslaanKnop) {
    const cloudLabel = document.createElement('div');
    cloudLabel.id = 'cloud-sync-status';
    cloudLabel.className = 'bg-np-dark border border-green-700/60 text-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 select-none';
    cloudLabel.title = 'Elke wijziging wordt direct opgeslagen in je SkillTrack-account';
    cloudLabel.innerHTML = `
      <i class="ph-fill ph-check-circle text-np-green text-base"></i>
      <span>Automatisch opgeslagen</span>
    `;
    oudeOpslaanKnop.replaceWith(cloudLabel);
  }

  // 2. Voeg Profiel & Uitloggen knoppen toe rechtsboven
  const headerBtns = document.querySelector('header .no-print');
  if (headerBtns && !document.getElementById('sb-nav-btns')) {
    const navWrap = document.createElement('div');
    navWrap.id = 'sb-nav-btns';
    navWrap.className = 'flex items-center gap-2 border-l border-gray-700 pl-2.5';
    navWrap.innerHTML = `
      <a href="index.html?profiel=1" class="bg-np-dark hover:bg-gray-800 text-white border border-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5" title="Profiel of opleiding wijzigen">
        <i class="ph-bold ph-user-gear text-np-yellow text-base"></i>
        <span class="hidden md:inline">Profiel</span>
      </a>
      <button onclick="sbUitloggen()" class="bg-np-dark hover:bg-red-950 text-gray-300 hover:text-red-200 border border-gray-700 px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5" title="Uitloggen">
        <i class="ph-bold ph-sign-out text-base"></i>
        <span class="hidden md:inline">Uitloggen</span>
      </button>
    `;
    headerBtns.appendChild(navWrap);
  }

  // 3. Voeg SkillTrack-logo en rejo-edu credits toe aan de voettekst onderaan
  const footer = document.querySelector('footer');
  if (footer && !document.getElementById('rejo-edu-credits')) {
    const creditBalk = document.createElement('div');
    creditBalk.id = 'rejo-edu-credits';
    creditBalk.className = 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 mt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500';
    creditBalk.innerHTML = `
      <div class="flex items-center gap-2.5">
        <img src="logo-skilltrack.jpg" alt="SkillTrack" class="h-6 w-auto rounded" />
        <span class="font-bold text-np-black">SkillTrack</span>
        <span>•</span>
        <span>Digitale leerroute en voortgangsmonitor</span>
      </div>
      <div class="font-semibold text-gray-600">
        Ontworpen en ontwikkeld door <span class="text-np-black font-extrabold">rejo-edu</span>
      </div>
    `;
    footer.appendChild(creditBalk);
  }

  // 4. Voeg SkillTrack-logo en rejo-edu credits toe aan de voettekst onderaan
  const footer = document.querySelector('footer');
  if (footer && !document.getElementById('rejo-edu-credits')) {
    const creditBalk = document.createElement('div');
    creditBalk.id = 'rejo-edu-credits';
    creditBalk.className = 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 mt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500';
    creditBalk.innerHTML = `
      <div class="flex items-center gap-2.5">
        <img src="logo-skilltrack.jpg" alt="SkillTrack" class="h-6 w-auto rounded" />
        <span class="font-bold text-np-black">SkillTrack</span>
        <span>•</span>
        <span>Digitale leerroute en voortgangsmonitor</span>
      </div>
      <div class="font-semibold text-gray-600">
        Ontworpen en ontwikkeld door <span class="text-np-black font-extrabold">rejo-edu</span>
      </div>
    `;
    footer.appendChild(creditBalk);
  }
}

async function laadStudentUitDatabase() {
  const { data: { session } } = await sbClient.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  currentStudentId = session.user.id;

  const { data: profiel } = await sbClient
    .from('profielen')
    .select('*')
    .eq('id', currentStudentId)
    .single();

  if (!profiel) {
    window.location.href = 'index.html';
    return;
  }

  if (profiel.naam) {
    userState.studentName = profiel.naam;
    const nameInput = document.getElementById('student-name-input');
    const printName = document.getElementById('print-student-name');
    if (nameInput) nameInput.value = profiel.naam;
    if (printName) printName.textContent = profiel.naam;
  }

  const { data: voortgangRows, error } = await sbClient
    .from('voortgang')
    .select('*')
    .eq('student_id', currentStudentId);

  if (!error && voortgangRows) {
    const dbCompleted = {};
    const dbNotes = {};
    voortgangRows.forEach(row => {
      dbCompleted[row.onderdeel_id] = !!row.afgerond;
      if (row.notitie) dbNotes[row.onderdeel_id] = row.notitie;
    });

    userState.completed = dbCompleted;
    userState.notes = dbNotes;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userState));
    if (typeof renderAll === 'function') renderAll();
  }
}

async function syncItemNaarDatabase(itemId) {
  if (!sbClient || !currentStudentId) return;

  const statusEl = document.getElementById('cloud-sync-status');
  if (statusEl) {
    statusEl.innerHTML = `<i class="ph-bold ph-arrows-clockwise animate-spin text-np-yellow text-base"></i><span>Opslaan...</span>`;
  }

  const isAfgerond = !!userState.completed[itemId];
  const notitieTekst = (userState.notes[itemId] || '').trim();

  await sbClient.from('voortgang').upsert({
    student_id: currentStudentId,
    onderdeel_id: itemId,
    afgerond: isAfgerond,
    notitie: notitieTekst,
    bijgewerkt_op: new Date().toISOString()
  }, { onConflict: 'student_id,onderdeel_id' });

  if (statusEl) {
    statusEl.innerHTML = `<i class="ph-fill ph-check-circle text-np-green text-base"></i><span>Automatisch opgeslagen</span>`;
  }
}

const origineleToggleItemDirect = window.toggleItemDirect;
window.toggleItemDirect = function(event, itemId) {
  origineleToggleItemDirect(event, itemId);
  syncItemNaarDatabase(itemId);
};

const origineleCloseItemModal = window.closeItemModal;
window.closeItemModal = function() {
  const itemId = activeModalItemId;
  origineleCloseItemModal();
  if (itemId) syncItemNaarDatabase(itemId);
};

const origineleConfirmResetProgress = window.confirmResetProgress;
window.confirmResetProgress = async function() {
  origineleConfirmResetProgress();
  if (sbClient && currentStudentId) {
    await sbClient.from('voortgang').delete().eq('student_id', currentStudentId);
  }
};

async function sbUitloggen() {
  if (sbClient) await sbClient.auth.signOut();
  window.location.href = 'index.html';
}

window.addEventListener('load', () => {
  setTimeout(initSupabaseSync, 100);
});

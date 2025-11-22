const SUPABASE_URL = 'https://sxhsqkyhflepeaexvqmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aHNxa3loZmxlcGVhZXh2cW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTUxNDMsImV4cCI6MjA3ODAzMTE0M30.s2EmGHQr8Ijrs71VHIlEXzagJrUDvOC4y-hY0wOkP0A';

// YOUR ADMIN ID
const ADMIN_USER_ID = '50351ca7-3c14-4095-99a9-e6cbb4e6482a'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let appState = {
    people: [],
    currentUser: null,
    userVotes: {}, 
    isAdmin: false,
    lastGlobalReset: null,
    username: null
};

// --- OPTIMIZED INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup listeners immediately so buttons work even if data is loading
    setupListeners();

    // 2. Visual Feedback: Let user know we are connecting
    const chatInput = document.getElementById('chatInput');
    if(chatInput) chatInput.placeholder = "Connecting to secure channel...";

    // 3. PARALLEL LOADING (The Fix)
    // We fire all requests at the same time instead of waiting for one to finish before starting the next.
    Promise.all([
        loadSettings(),
        loadPeople(),
        loadNews(),
        loadChat(),
        initAuth() // Auth runs in parallel with data loading
    ]).then(() => {
        setupRealtime(); // Connect realtime last
    });
});

// --- CORE VOTING LOGIC ---

async function voteOnPerson(personId, voteType) {
    if (!appState.currentUser) {
        openModal('userAuthModal');
        return;
    }

    const previousVote = appState.userVotes[personId];
    let isStale = false;
    if (previousVote && new Date(previousVote.created_at) < appState.lastGlobalReset) isStale = true;

    // Optimistic UI update (Instant click feel)
    // We don't wait for database to update UI color
    // (Actual re-render happens after DB confirms, but this makes it feel snappy)
    
    try {
        if (previousVote && !isStale) {
            if (previousVote.vote_type === voteType) {
                await supabase.from('votes').delete().eq('id', previousVote.id);
                delete appState.userVotes[personId];
            } else {
                await supabase.from('votes').update({ vote_type: voteType }).eq('id', previousVote.id);
                appState.userVotes[personId].vote_type = voteType;
            }
        } else {
            const { data, error } = await supabase.from('votes').insert({
                user_id: appState.currentUser.id,
                person_id: personId,
                vote_type: voteType
            }).select().single();
            if (error) throw error;
            appState.userVotes[personId] = data;
        }
        await refreshPersonScore(personId);
    } catch (error) {
        console.error("Voting error:", error);
    }
}

async function refreshPersonScore(personId) {
    const { count: ups } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('person_id', personId).eq('vote_type', 'up');
    const { count: downs } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('person_id', personId).eq('vote_type', 'down');

    const newScore = 150 + ((ups - downs) * 5); 
    
    await supabase.from('people').update({ score: newScore }).eq('id', personId);
    
    const p = appState.people.find(x => x.id == personId);
    if(p) p.score = newScore;
    renderPeopleList();
    updateStats();
}

// --- DATA & UI RENDERING ---

async function loadPeople() {
    const { data } = await supabase.from('people').select('*');
    if (data) {
        appState.people = data;
        renderPeopleList();
        updateStats();
    }
}

function renderPeopleList() {
    const container = document.getElementById('peopleList');
    const filterTxt = document.getElementById('searchInput').value.toLowerCase();
    const sortMode = document.getElementById('sortFilter').value;

    let filtered = appState.people.filter(p => p.name.toLowerCase().includes(filterTxt));

    filtered.sort((a, b) => {
        if (sortMode === 'score_desc') return b.score - a.score;
        if (sortMode === 'score_asc') return a.score - b.score;
        return a.name.localeCompare(b.name);
    });

    container.innerHTML = filtered.map(p => {
        const voteData = appState.userVotes[p.id];
        let voteType = null;
        if (voteData && new Date(voteData.created_at) > appState.lastGlobalReset) {
            voteType = voteData.vote_type;
        }

        const scoreClass = p.score > 150 ? 'score-pos' : (p.score < 150 ? 'score-neg' : 'score-neu');

        return `
            <div class="person-card">
                <div class="card-info">
                    <div class="person-name">${escapeHtml(p.name)}</div>
                    <div class="person-score ${scoreClass}">${p.score}</div>
                </div>
                <div class="vote-actions">
                    <button class="vote-btn up ${voteType === 'up' ? 'active' : ''}" onclick="voteOnPerson(${p.id}, 'up')">Up</button>
                    <button class="vote-btn down ${voteType === 'down' ? 'active' : ''}" onclick="voteOnPerson(${p.id}, 'down')">Down</button>
                </div>
                ${appState.isAdmin ? `
                    <button class="btn-edit-person" onclick="openEditModal(${p.id})">✎</button>
                    <button class="btn-delete-person" onclick="deletePerson(${p.id})">&times;</button>
                ` : ''}
            </div>
        `;
    }).join('');
}

// --- ADMIN FEATURES ---

function openEditModal(personId = null) {
    const title = document.getElementById('editModalTitle');
    const nameInput = document.getElementById('personName');
    const scoreInput = document.getElementById('personScore');
    const idInput = document.getElementById('personId');

    if (personId) {
        const person = appState.people.find(p => p.id === personId);
        title.innerText = "Edit Person";
        nameInput.value = person.name;
        scoreInput.value = person.score;
        idInput.value = person.id;
    } else {
        title.innerText = "Add Person";
        nameInput.value = "";
        scoreInput.value = 150;
        idInput.value = "";
    }
    openModal('editModal');
}

async function handlePersonSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('personName').value;
    const score = parseInt(document.getElementById('personScore').value);
    const id = document.getElementById('personId').value;

    if (id) {
        const { error } = await supabase.from('people').update({ name, score }).eq('id', id);
        if (!error) {
            const p = appState.people.find(x => x.id == id);
            if(p) { p.name = name; p.score = score; }
        }
    } else {
        await supabase.from('people').insert({ name, score, approved: true });
    }
    
    closeModal();
    loadPeople();
}

async function deletePerson(id) {
    if(confirm("Delete this person?")) { 
        await supabase.from('people').delete().eq('id', id); 
        loadPeople(); 
    }
}

async function loadNews() {
    const { data } = await supabase.from('news').select('*').order('created_at', {ascending: false});
    const track = document.getElementById('newsTrack');
    if(data && data.length) {
        const newsItems = data.map(n => `<span class="news-item">${escapeHtml(n.text)}</span>`).join('');
        let content = newsItems; for(let i=0; i<10; i++) content += newsItems;
        track.innerHTML = content;
    } else {
        track.innerHTML = '<span class="news-item">Welcome to The Auralist •</span>'.repeat(10);
    }

    const adminList = document.getElementById('newsListAdmin');
    if(adminList && appState.isAdmin && data) {
        adminList.innerHTML = data.map(n => `
            <div class="admin-news-item">
                <span>${escapeHtml(n.text)}</span>
                <button class="btn-delete-news" onclick="deleteNews(${n.id})">Delete</button>
            </div>
        `).join('');
    }
}

async function addNews() {
    await supabase.from('news').insert({ text: document.getElementById('newsText').value });
    closeModal(); loadNews();
}

async function deleteNews(id) {
    if(!confirm("Delete?")) return;
    await supabase.from('news').delete().eq('id', id);
    loadNews();
}

// --- AUTH (OPTIMIZED) ---

async function initAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        await handleUserLogin(session.user);
    } else {
        // Not logged in: Chat remains visible but disabled
        document.getElementById('chatInput').placeholder = "Login to chat";
    }
}

async function handleUserLogin(user) {
    appState.currentUser = user;
    document.getElementById('userAuthBtn').innerText = 'Sign Out';
    
    if (user.id === ADMIN_USER_ID) {
        appState.isAdmin = true;
        document.getElementById('adminControls').style.display = 'block';
    }

    // Load Votes & Profile in parallel
    const [votesRes, profileRes] = await Promise.all([
        supabase.from('votes').select('*').eq('user_id', user.id),
        supabase.from('user_profiles').select('username').eq('user_id', user.id).single()
    ]);

    if(votesRes.data) votesRes.data.forEach(v => appState.userVotes[v.person_id] = v);
    
    if (profileRes.data) {
        appState.username = profileRes.data.username;
        document.getElementById('chatInput').disabled = false;
        document.getElementById('chatSendBtn').disabled = false;
        document.getElementById('chatInput').placeholder = "Join the conversation...";
    } else {
        openModal('userAuthModal');
    }
    
    // Re-render UI now that we know who the user is (update vote buttons colors and chat sides)
    renderPeopleList();
    renderChatList(lastLoadedChatMessages); // Uses cached chat messages to fix alignment
}

// --- LISTENERS ---

function setupListeners() {
    document.getElementById('userAuthBtn').onclick = () => appState.currentUser ? supabase.auth.signOut().then(()=>location.reload()) : openModal('userAuthModal');
    document.getElementById('userLoginForm').onsubmit = (e) => { e.preventDefault(); loginUser(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value); };
    document.getElementById('userSignupForm').onsubmit = (e) => { e.preventDefault(); signupUser(document.getElementById('signupEmail').value, document.getElementById('signupPassword').value, document.getElementById('signupUsername').value); };
    document.getElementById('tabLogin').onclick = (e) => switchTab(e, 'login');
    document.getElementById('tabSignup').onclick = (e) => switchTab(e, 'signup');

    document.getElementById('adminBtn').onclick = () => appState.isAdmin ? (appState.isAdmin=false, document.getElementById('adminControls').style.display='none', loadPeople(), loadNews()) : openModal('adminLoginModal');
    document.getElementById('adminLoginForm').onsubmit = handleAdminLogin;
    
    document.getElementById('personForm').onsubmit = handlePersonSubmit;
    document.getElementById('resetCooldownBtn').onclick = resetVoting;
    document.getElementById('addPersonBtn').onclick = () => openEditModal(null);
    
    document.getElementById('manageNewsBtn').onclick = () => openModal('newsModal');
    document.getElementById('newsForm').onsubmit = (e) => { e.preventDefault(); addNews(); };
    document.getElementById('chatForm').onsubmit = sendChat;
    
    document.getElementById('searchInput').oninput = renderPeopleList;
    document.getElementById('sortFilter').onchange = renderPeopleList;
    document.querySelectorAll('.close-btn').forEach(b => b.onclick = () => closeModal(b.closest('.modal').id));
}

// --- UTILS ---
function openModal(id) { document.getElementById('modalOverlay').classList.add('show'); document.querySelectorAll('.modal').forEach(m=>m.style.display='none'); document.getElementById(id).style.display='block'; }
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }
function switchTab(e, type) { e.preventDefault(); document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); e.target.classList.add('active'); document.getElementById('userLoginForm').style.display = type==='login'?'block':'none'; document.getElementById('userSignupForm').style.display = type==='signup'?'block':'none'; }
function escapeHtml(t) { return t ? t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : ''; }

// Standard Async Handlers
async function loginUser(email, password) { const { error } = await supabase.auth.signInWithPassword({ email, password }); if(error) document.getElementById('loginError').innerText = error.message; else window.location.reload(); }
async function signupUser(email, password, username) { if(password.length<6) return document.getElementById('signupError').innerText="Pass too short"; const { data, error } = await supabase.auth.signUp({ email, password }); if(error) return document.getElementById('signupError').innerText = error.message; if(data.user) { await supabase.from('user_profiles').insert([{ user_id: data.user.id, username }]); document.getElementById('tabLogin').click(); } }
async function loadSettings() { const { data } = await supabase.from('app_settings').select('value').eq('key', 'last_voting_reset').single(); appState.lastGlobalReset = data ? new Date(data.value) : new Date(0); }
async function resetVoting() { if(!confirm("Start new round?")) return; const now = new Date().toISOString(); await supabase.from('app_settings').upsert({key:'last_voting_reset', value:now}); appState.lastGlobalReset = new Date(now); appState.userVotes = {}; renderPeopleList(); }
async function handleAdminLogin(e) { e.preventDefault(); const { data } = await supabase.auth.signInWithPassword({ email: document.getElementById('adminEmail').value, password: document.getElementById('adminPassword').value }); if(data.user.id === ADMIN_USER_ID) { appState.isAdmin = true; document.getElementById('adminControls').style.display='block'; closeModal(); loadNews(); renderPeopleList(); } else { alert("Not authorized"); } }
function updateStats() { const count = appState.people.length; const scores = appState.people.map(p => p.score); const avg = count ? Math.floor(scores.reduce((a,b)=>a+b,0)/count) : 0; const max = count ? Math.max(...scores) : 0; document.getElementById('totalCount').innerText = count; document.getElementById('avgScore').innerText = avg; document.getElementById('highestScore').innerText = max; }

// --- CHAT LOGIC ---

let lastLoadedChatMessages = []; // Cache to allow re-rendering after login without fetching

async function loadChat() {
    const { data } = await supabase.from('chat_messages').select('*').order('created_at', {ascending: true}).limit(50);
    if(data) {
        lastLoadedChatMessages = data;
        renderChatList(data);
    }
}

function renderChatList(messages) {
    const container = document.getElementById('chatMessages');
    container.innerHTML = messages.map(m => {
        // If user not logged in, all messages are 'other'. If logged in, check ID.
        const isOwn = appState.currentUser && m.user_id === appState.currentUser.id;
        return `
            <div class="chat-msg ${isOwn ? 'msg-own' : 'msg-other'}">
                <span class="msg-user">${escapeHtml(m.username)}</span>
                ${escapeHtml(m.message)}
            </div>
        `;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

async function sendChat(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if(!msg || !appState.currentUser || !appState.username) return;
    
    // Clear input immediately for better UX
    input.value = '';
    
    await supabase.from('chat_messages').insert({
        user_id: appState.currentUser.id,
        username: appState.username,
        message: msg
    });
}

function setupRealtime() {
    supabase.channel('public:chat_messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        // Add new message to local cache and re-render
        lastLoadedChatMessages.push(payload.new);
        if (lastLoadedChatMessages.length > 50) lastLoadedChatMessages.shift(); // Keep cache size manageable
        renderChatList(lastLoadedChatMessages);
    }).subscribe();
}

// Supabase Configuration
const SUPABASE_URL = 'https://sxhsqkyhflepeaexvqmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aHNxa3loZmxlcGVhZXh2cW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTUxNDMsImV4cCI6MjA3ODAzMTE0M30.s2EmGHQr8Ijrs71VHIlEXzagJrUDvOC4y-hY0wOkP0A';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let allPeople = [];
let filteredPeople = [];
let sortOrder = 'asc'; // 'asc' or 'desc'
let currentFilter = { letter: '', score: '', search: '' };
let isAdmin = false;
let editingPersonId = null;
let isInitialized = false; // Prevent multiple initializations

// Admin User ID - Get this from Supabase Auth after creating your admin account
// Go to Supabase Dashboard → Authentication → Users → Copy your User ID
// ⚠️ IMPORTANT: Replace this with your actual User ID!
const ADMIN_USER_ID = '50351ca7-3c14-4095-99a9-e6cbb4e6482a'; // Set this to your User ID from Supabase Auth

// Security Note: Using Supabase Auth instead of plain password
// This is much more secure as authentication is handled server-side

// DOM Elements
const peopleList = document.getElementById('peopleList');
const searchInput = document.getElementById('searchInput');
const letterFilter = document.getElementById('letterFilter');
const scoreFilter = document.getElementById('scoreFilter');
const sortBtn = document.getElementById('sortBtn');
const totalCount = document.getElementById('totalCount');
const avgScore = document.getElementById('avgScore');
const highestScore = document.getElementById('highestScore');
const adminBtn = document.getElementById('adminBtn');
const adminControls = document.getElementById('adminControls');
const loginModal = document.getElementById('loginModal');
const editModal = document.getElementById('editModal');
const loginForm = document.getElementById('loginForm');
const personForm = document.getElementById('personForm');

// Initial data (fallback if Supabase is not configured)
const initialData = [
    { name: 'Patato', score: 250 },
    { name: 'K', score: 240 },
    { name: 'Ami', score: 250 },
    { name: 'Mushroom', score: 120 },
    { name: 'Olvr', score: 295 },
    { name: 'Jin', score: 450 },
    { name: 'Yato', score: 480 },
    { name: 'Heeve', score: 260 },
    { name: 'Schrodinger', score: 290 },
    { name: 'Ren', score: 450 },
    { name: 'Yuta', score: 380 },
    { name: 'Bang Si', score: 160 },
    { name: 'Felecia', score: 130 },
    { name: 'Catch My Fade', score: 450 },
    { name: 'Nona', score: 280 },
    { name: 'Siri', score: 460 },
    { name: 'Addi', score: 330 },
    { name: 'Purr', score: 43 },
    { name: 'Buttercup', score: 200 },
    { name: 'Good Clown', score: 200 },
    { name: 'Gelii', score: 320 },
    { name: 'Kate', score: 420 },
    { name: 'Alex', score: 300 },
    { name: 'Wine', score: 350 },
    { name: 'Deo', score: 400 },
    { name: 'Tequila', score: 280 },
    { name: 'Belle', score: 200 },
    { name: 'Veronica', score: 300 },
    { name: 'Ligaya', score: 30 },
    { name: 'Maeve', score: 65 },
    { name: 'Popsmoke', score: 180 },
    { name: 'Doctor', score: 142 },
    { name: 'Beau', score: 240 },
    { name: 'M', score: 280 },
    { name: 'Kiana', score: 70 },
    { name: 'Demeter', score: 195 },
    { name: 'Elena', score: 120 },
    { name: 'Owwraytttt', score: 170 },
    { name: 'Uncle.yur', score: 30 },
    { name: 'Bobby', score: 350 },
    { name: 'Aqui', score: 450 },
    { name: 'Hoshi', score: 130 },
    { name: 'Tora', score: -100 },
    { name: 'Toe Sniffer', score: -20 },
    { name: 'Alexis', score: 140 },
    { name: 'Ursus', score: 70 },
    { name: 'Rick', score: 170 },
    { name: 'Pork Chops', score: 40 },
    { name: 'Jeanpaulgualtier', score: 67 },
    { name: 'Janice', score: -60 },
    { name: 'Zaine', score: 176 },
    { name: 'Thaven', score: 119 },
    { name: 'Kae', score: 138 },
    { name: 'Mica', score: 144 },
    { name: 'Omuamua', score: 151 },
    { name: 'Aint Inno', score: 182 },
    { name: 'Rof', score: 199 },
    { name: 'Meep', score: 160 },
    { name: 'Bumblebee', score: 121 },
    { name: 'Sia', score: 175 },
    { name: 'Robert', score: 142 },
    { name: 'Light', score: 108 },
    { name: 'Volker', score: 189 },
    { name: 'Pat', score: 134 },
    { name: 'Nyx', score: 178 },
    { name: 'Z (male)', score: 166 },
    { name: 'Dosii', score: 149 }
];

// Initialize
async function init() {
    // Prevent multiple initializations
    if (isInitialized) {
        console.warn('Already initialized, skipping...');
        return;
    }
    isInitialized = true;
    
    // Check admin status from Supabase Auth
    await checkAdminStatus();
    
    // Check if Supabase is configured
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('Supabase not configured. Using local data. See SETUP.md for instructions.');
        allPeople = initialData;
        filterPeople();
        setupEventListeners();
        return;
    }

    try {
        await loadPeople();
    } catch (error) {
        console.error('Error initializing:', error);
        // Fallback to local data
        allPeople = initialData;
        filterPeople();
    }
    
    setupEventListeners();
}

// Load people from Supabase
async function loadPeople() {
    try {
        const { data, error } = await supabase
            .from('people')
            .select('*')
            .eq('approved', true)
            .order('name', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            allPeople = data.map(p => ({ id: p.id, name: p.name, score: p.score }));
        } else {
            // If no data, use initial data
            allPeople = initialData;
        }

        filterPeople();
    } catch (error) {
        console.error('Error loading people:', error);
        throw error;
    }
}

// Render people list
function renderPeople() {
    // Prevent rendering if element doesn't exist
    if (!peopleList) {
        console.error('People list element not found');
        return;
    }
    
    if (filteredPeople.length === 0) {
        peopleList.innerHTML = '<div class="empty-state"><h3>No people found</h3><p>Try adjusting your filters</p></div>';
        return;
    }

    peopleList.innerHTML = filteredPeople.map(person => {
        const adminButtons = isAdmin ? `
            <div class="person-actions">
                <button class="edit-btn" onclick="editPerson(${person.id}, '${escapeHtml(person.name)}', ${person.score})">✏️ Edit</button>
                <button class="delete-btn" onclick="deletePerson(${person.id})">🗑️ Delete</button>
            </div>
        ` : '';
        
        return `
        <div class="person-card">
            <div class="person-name">${escapeHtml(person.name)}</div>
            <div class="person-score ${getScoreClass(person.score)}">
                ${person.score > 0 ? '+' : ''}${person.score}
            </div>
            ${adminButtons}
        </div>
    `;
    }).join('');
}

// Get score CSS class
function getScoreClass(score) {
    if (score > 0) return 'score-positive';
    if (score < 0) return 'score-negative';
    return 'score-neutral';
}

// Filter people
function filterPeople() {
    filteredPeople = [...allPeople];

    // Filter by search
    if (currentFilter.search) {
        const searchLower = currentFilter.search.toLowerCase();
        filteredPeople = filteredPeople.filter(p => 
            p.name.toLowerCase().includes(searchLower)
        );
    }

    // Filter by letter
    if (currentFilter.letter) {
        filteredPeople = filteredPeople.filter(p => 
            p.name.charAt(0).toUpperCase() === currentFilter.letter
        );
    }

    // Filter by score range
    if (currentFilter.score) {
        switch (currentFilter.score) {
            case 'negative':
                filteredPeople = filteredPeople.filter(p => p.score < 0);
                break;
            case 'low':
                filteredPeople = filteredPeople.filter(p => p.score >= 0 && p.score <= 100);
                break;
            case 'medium':
                filteredPeople = filteredPeople.filter(p => p.score > 100 && p.score <= 250);
                break;
            case 'high':
                filteredPeople = filteredPeople.filter(p => p.score > 250 && p.score <= 400);
                break;
            case 'very-high':
                filteredPeople = filteredPeople.filter(p => p.score > 400);
                break;
        }
    }

    // Sort
    filteredPeople.sort((a, b) => {
        if (sortOrder === 'asc') {
            return a.name.localeCompare(b.name);
        } else {
            return b.name.localeCompare(a.name);
        }
    });

    renderPeople();
    updateStats();
}

// Update statistics
function updateStats() {
    const people = filteredPeople.length > 0 ? filteredPeople : allPeople;
    
    totalCount.textContent = people.length;
    
    if (people.length > 0) {
        const avg = Math.round(people.reduce((sum, p) => sum + p.score, 0) / people.length);
        avgScore.textContent = avg > 0 ? `+${avg}` : avg;
        
        const highest = Math.max(...people.map(p => p.score));
        highestScore.textContent = highest > 0 ? `+${highest}` : highest;
    } else {
        avgScore.textContent = '0';
        highestScore.textContent = '0';
    }
}

// Toggle sort
function toggleSort() {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortBtn.textContent = `Sort: ${sortOrder === 'asc' ? 'A-Z' : 'Z-A'}`;
    filterPeople();
}

// Admin Functions
async function checkAdminStatus() {
    try {
        // Check if user is authenticated with Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            const userId = session.user?.id;
            // Check if this is the admin user
            if (ADMIN_USER_ID && userId === ADMIN_USER_ID) {
                isAdmin = true;
                sessionStorage.setItem('isAdmin', 'true');
                updateAdminUI();
            } else if (!ADMIN_USER_ID) {
                // If ADMIN_USER_ID not set, allow any authenticated user (testing only)
                isAdmin = true;
                sessionStorage.setItem('isAdmin', 'true');
                updateAdminUI();
            }
        } else {
            // No active session, clear admin status
            isAdmin = false;
            sessionStorage.removeItem('isAdmin');
            sessionStorage.removeItem('adminSession');
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        isAdmin = false;
    }
}

function updateAdminUI() {
    if (isAdmin) {
        adminBtn.textContent = '🔓 Logout';
        adminControls.style.display = 'flex';
    } else {
        adminBtn.textContent = '🔐 Admin';
        adminControls.style.display = 'none';
    }
    renderPeople(); // Re-render to show/hide edit buttons
}

// Login with Supabase Auth
async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            showLoginError(error.message);
            return false;
        }

        // Check if this user is the admin
        const userId = data.user?.id;
        if (ADMIN_USER_ID && userId === ADMIN_USER_ID) {
            isAdmin = true;
            sessionStorage.setItem('isAdmin', 'true');
            sessionStorage.setItem('adminSession', data.session?.access_token);
            updateAdminUI();
            closeModal(loginModal);
            loginForm.reset();
            hideLoginError();
            return true;
        } else if (!ADMIN_USER_ID) {
            // If ADMIN_USER_ID is not set, allow any authenticated user (for testing)
            // ⚠️ WARNING: Set ADMIN_USER_ID for production!
            isAdmin = true;
            sessionStorage.setItem('isAdmin', 'true');
            sessionStorage.setItem('adminSession', data.session?.access_token);
            updateAdminUI();
            closeModal(loginModal);
            loginForm.reset();
            hideLoginError();
            return true;
        } else {
            // User is authenticated but not the admin
            await supabase.auth.signOut();
            showLoginError('Access denied. This account is not authorized.');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Login failed. Please try again.');
        return false;
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function hideLoginError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

async function logout() {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }
    isAdmin = false;
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminSession');
    updateAdminUI();
}

// Add person
async function addPerson(name, score) {
    try {
        const { data, error } = await supabase
            .from('people')
            .insert([{
                name: name.trim(),
                score: parseInt(score),
                approved: true
            }])
            .select();

        if (error) throw error;

        // Clear filters to show all people after add
        currentFilter = { letter: '', score: '', search: '' };
        searchInput.value = '';
        letterFilter.value = '';
        scoreFilter.value = '';
        
        await loadPeople();
        closeModal(editModal);
        personForm.reset();
        editingPersonId = null;
    } catch (error) {
        console.error('Error adding person:', error);
        alert('Error adding person. Please try again.');
    }
}

// Edit person
async function updatePerson(id, name, score) {
    try {
        const { error } = await supabase
            .from('people')
            .update({
                name: name.trim(),
                score: parseInt(score)
            })
            .eq('id', id);

        if (error) throw error;

        // Clear filters to show all people after edit
        currentFilter = { letter: '', score: '', search: '' };
        searchInput.value = '';
        letterFilter.value = '';
        scoreFilter.value = '';
        
        await loadPeople();
        closeModal(editModal);
        personForm.reset();
        editingPersonId = null;
    } catch (error) {
        console.error('Error updating person:', error);
        alert('Error updating person. Please try again.');
    }
}

// Delete person
async function deletePerson(id) {
    if (!confirm('Are you sure you want to delete this person?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('people')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Clear filters to show all people after delete
        currentFilter = { letter: '', score: '', search: '' };
        searchInput.value = '';
        letterFilter.value = '';
        scoreFilter.value = '';
        
        await loadPeople();
    } catch (error) {
        console.error('Error deleting person:', error);
        alert('Error deleting person. Please try again.');
    }
}

// Open edit modal
function editPerson(id, name, score) {
    editingPersonId = id;
    document.getElementById('modalTitle').textContent = 'Edit Person';
    document.getElementById('personName').value = name;
    document.getElementById('personScore').value = score;
    openModal(editModal);
}

// Modal functions
function openModal(modal) {
    modal.classList.add('show');
}

function closeModal(modal) {
    modal.classList.remove('show');
}

// Setup event listeners
function setupEventListeners() {
    // Admin button
    adminBtn.addEventListener('click', () => {
        if (isAdmin) {
            logout();
        } else {
            openModal(loginModal);
        }
    });

    // Login form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        await login(email, password);
    });

    // Add person button
    document.getElementById('addPersonBtn').addEventListener('click', () => {
        editingPersonId = null;
        document.getElementById('modalTitle').textContent = 'Add Person';
        personForm.reset();
        openModal(editModal);
    });

    // Person form
    personForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('personName').value;
        const score = document.getElementById('personScore').value;

        if (editingPersonId) {
            await updatePerson(editingPersonId, name, score);
        } else {
            await addPerson(name, score);
        }
    });

    // Cancel buttons
    document.getElementById('cancelLoginBtn').addEventListener('click', () => {
        closeModal(loginModal);
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        closeModal(editModal);
        editingPersonId = null;
    });

    // Close modals with X button
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            closeModal(modal);
            editingPersonId = null;
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModal(loginModal);
        if (e.target === editModal) {
            closeModal(editModal);
            editingPersonId = null;
        }
    });

    // Filter and search listeners
    searchInput.addEventListener('input', (e) => {
        currentFilter.search = e.target.value;
        filterPeople();
    });

    letterFilter.addEventListener('change', (e) => {
        currentFilter.letter = e.target.value;
        filterPeople();
    });

    scoreFilter.addEventListener('change', (e) => {
        currentFilter.score = e.target.value;
        filterPeople();
    });

    sortBtn.addEventListener('click', toggleSort);
}

// Make functions available globally for onclick handlers
window.editPerson = editPerson;
window.deletePerson = deletePerson;

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on load - only once
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already loaded
    init();
}

